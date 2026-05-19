import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  HttpException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class GatewayService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  private channelWhere(userId?: number) {
    return {
      status: true,
      OR: [{ userId: userId || -1 }, { visibility: 'public' }],
    };
  }

  private estimateTokensFromText(value: unknown): number {
    if (!value) return 0;
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return Math.max(1, Math.ceil(text.length / 4));
  }

  private estimateChatUsage(
    messages: { role: string; content: unknown }[],
    completion: string,
  ) {
    const promptTokens = messages.reduce(
      (sum, message) => sum + this.estimateTokensFromText(message.content),
      0,
    );
    const completionTokens = this.estimateTokensFromText(completion);

    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    };
  }

  async proxyChat(authHeader: string, body: any, ip: string) {
    const key = authHeader?.replace('Bearer ', '');
    if (!key) throw new UnauthorizedException('No token provided');

    const token = await this.prisma.token.findUnique({ where: { key } });
    if (!token || !token.status)
      throw new UnauthorizedException('Invalid or disabled token');

    // Check token expiry
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      throw new UnauthorizedException('Token has expired');
    }

    // Check quota
    if (token.quota !== -1 && token.used >= token.quota) {
      throw new HttpException('Token quota exceeded', 429);
    }

    // Check model whitelist
    if (token.allowedModels) {
      const allowed = token.allowedModels
        .split(',')
        .map((s: string) => s.trim());
      if (allowed.length > 0 && !allowed.includes(body.model)) {
        throw new ForbiddenException(
          `Model '${body.model}' is not allowed for this token`,
        );
      }
    }

    // Channel selection: respect token user's visibility rules
    const channels = await this.prisma.channel.findMany({
      where: this.channelWhere(token.userId ?? undefined),
    });
    const channel = channels.find((c) =>
      c.models.split(',').includes(body.model),
    );

    if (!channel)
      throw new NotFoundException(
        `No active channel found for model: ${body.model}`,
      );

    try {
      const response = await axios.post(
        `${channel.baseUrl}/v1/chat/completions`,
        body,
        {
          headers: {
            Authorization: `Bearer ${channel.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: body.stream ? 'stream' : 'json',
          timeout: 60000,
        },
      );

      if (!body.stream) {
        const usage = response.data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        };
        await this.recordLog(
          token.id,
          channel.id,
          body.model,
          usage,
          ip,
          token.userId ?? undefined,
        );
      } else {
        this.trackStreamUsage(
          response.data,
          body.messages || [],
          token.id,
          channel.id,
          body.model,
          ip,
          token.userId ?? undefined,
        );
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Upstream responded with an error status
        const status = error.response.status;
        const upstreamError =
          error.response.data?.error?.message ||
          error.response.data ||
          'Upstream provider error';
        throw new HttpException(
          { error: { message: upstreamError, type: 'upstream_error' } },
          status,
        );
      }
      if (error.request) {
        // No response received (timeout, network issue)
        throw new HttpException(
          {
            error: {
              message: 'Upstream provider unreachable',
              type: 'gateway_timeout',
            },
          },
          502,
        );
      }
      throw new HttpException(
        { error: { message: 'Internal proxy error', type: 'internal_error' } },
        500,
      );
    }
  }

  private async recordLog(
    tokenId: number,
    channelId: number,
    model: string,
    usage: any,
    ip: string,
    userId?: number,
    isEstimated: boolean = false,
  ) {
    const promptTokens = Number(usage.prompt_tokens) || 0;
    const completionTokens = Number(usage.completion_tokens) || 0;
    const total =
      Number(usage.total_tokens) || promptTokens + completionTokens;

    // Calculate cost if pricing is configured
    let costData: any = {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
      pricingSnapshot: null,
    };

    try {
      const calc = await this.pricingService.calculateCost(
        channelId,
        model,
        promptTokens,
        completionTokens,
      );
      if (calc) {
        costData = {
          inputCost: calc.inputCost,
          outputCost: calc.outputCost,
          totalCost: calc.totalCost,
          currency: calc.currency,
          pricingSnapshot: JSON.stringify(calc.pricingSnapshot),
        };
      }
    } catch {
      // Cost calculation is non-critical; continue without it
    }

    const ops: any[] = [
      this.prisma.log.create({
        data: {
          tokenId: tokenId || null,
          channelId,
          model,
          promptTokens,
          completionTokens,
          totalTokens: total,
          ip,
          userId,
          inputCost: costData.inputCost,
          outputCost: costData.outputCost,
          totalCost: costData.totalCost,
          currency: costData.currency,
          pricingSnapshot: costData.pricingSnapshot,
          isEstimated,
        },
      }),
    ];
    // Only update token usage when a real token is involved
    if (tokenId) {
      ops.push(
        this.prisma.token.update({
          where: { id: tokenId },
          data: { used: { increment: total } },
        }),
      );
    }
    await this.prisma.$transaction(ops);
  }

  private trackStreamUsage(
    stream: NodeJS.ReadableStream,
    messages: { role: string; content: unknown }[],
    tokenId: number,
    channelId: number,
    model: string,
    ip: string,
    userId?: number,
  ) {
    let usage: any = null;
    let completion = '';
    let buffer = '';
    let streamDone = false;

    stream.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:') || trimmed.includes('[DONE]')) {
          continue;
        }
        try {
          const json = JSON.parse(trimmed.slice(5).trim());
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === 'string') {
            completion += delta;
          }
          if (json.usage) {
            usage = json.usage;
          }
        } catch {}
      }
    });

    stream.on('end', async () => {
      const isEstimated = !usage;
      const finalUsage = usage || this.estimateChatUsage(messages, completion);
      try {
        await this.recordLog(
          tokenId, channelId, model, finalUsage, ip, userId, isEstimated,
        );
      } catch {}
    });
  }

  async playgroundChat(
    body: {
      model: string;
      messages: { role: string; content: unknown }[];
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    },
    ctx?: { userId?: number },
  ) {
    const channels = await this.prisma.channel.findMany({
      where: this.channelWhere(ctx?.userId),
    });
    const channel = channels.find((c) =>
      c.models.split(',').includes(body.model),
    );

    if (!channel)
      throw new NotFoundException(
        `No active channel found for model: ${body.model}`,
      );

    const payload = {
      model: body.model,
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.maxTokens ?? 2048,
      top_p: body.topP ?? 1.0,
    };

    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${channel.baseUrl}/v1/chat/completions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${channel.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      );
      const latencyMs = Date.now() - startTime;

      const usage = response.data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      // Record log for playground chat calls
      await this.recordLog(
        0, // playground calls don't require a token
        channel.id,
        body.model,
        usage,
        '', // no client IP in playground context
        ctx?.userId,
      );

      return {
        message: response.data.choices?.[0]?.message || {
          role: 'assistant',
          content: '',
        },
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        model: response.data.model || body.model,
        latencyMs,
        channel: { id: channel.id, name: channel.name, type: channel.type },
      };
    } catch (error: any) {
      if (error.response) {
        const upstreamError =
          error.response.data?.error?.message ||
          error.response.data ||
          'Upstream provider error';
        throw new HttpException(
          { error: { message: upstreamError, type: 'upstream_error' } },
          error.response.status,
        );
      }
      if (error.request) {
        throw new HttpException(
          {
            error: {
              message: 'Upstream provider unreachable',
              type: 'gateway_timeout',
            },
          },
          502,
        );
      }
      throw new HttpException(
        { error: { message: 'Internal proxy error', type: 'internal_error' } },
        500,
      );
    }
  }

  async playgroundChatStream(
    body: {
      model: string;
      messages: { role: string; content: unknown }[];
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    },
    res: Response,
    ctx?: { userId?: number },
  ) {
    const channels = await this.prisma.channel.findMany({
      where: this.channelWhere(ctx?.userId),
    });
    const channel = channels.find((c) =>
      c.models.split(',').includes(body.model),
    );

    if (!channel)
      throw new NotFoundException(
        `No active channel found for model: ${body.model}`,
      );

    const payload = {
      model: body.model,
      messages: body.messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.maxTokens ?? 2048,
      top_p: body.topP ?? 1.0,
      stream: true,
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let usage: any = null;
    let completion = '';
    let buffer = '';
    let streamDone = false;

    try {
      const response = await axios.post(
        `${channel.baseUrl}/v1/chat/completions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${channel.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout: 120000,
        },
      );

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) {
            continue;
          }
          if (trimmed.includes('[DONE]')) {
            streamDone = true;
            return;
          }
          try {
            const json = JSON.parse(trimmed.slice(5).trim());
            const delta = json.choices?.[0]?.delta?.content;
            if (typeof delta === 'string') {
              completion += delta;
            }
            if (json.usage) {
              usage = json.usage;
            }
          } catch {}
          res.write(`${trimmed}\n\n`);
        }
      });

      response.data.on('end', async () => {
        const isEstimated = !usage;
        const finalUsage =
          usage || this.estimateChatUsage(body.messages, completion);
        res.write(
          `data: ${JSON.stringify({ usage: finalUsage })}\n\n`,
        );
        if (streamDone) {
          res.write('data: [DONE]\n\n');
        }
        try {
          await this.recordLog(
            0, channel.id, body.model, finalUsage, '', ctx?.userId, isEstimated,
          );
        } catch {}
        res.end();
      });

      response.data.on('error', (err: Error) => {
        res.write(
          `data: ${JSON.stringify({ error: { message: err.message, type: 'stream_error' } })}\n\n`,
        );
        res.end();
      });
    } catch (error: any) {
      if (!res.headersSent) {
        const msg =
          error.response?.data?.error?.message || 'Upstream provider error';
        res
          .status(502)
          .json({ error: { message: msg, type: 'gateway_error' } });
      } else {
        res.end();
      }
    }
  }

  async playgroundImage(
    body: {
      model: string;
      prompt: string;
      size?: string;
      quality?: string;
      n?: number;
    },
    ctx?: { userId?: number },
  ) {
    const channels = await this.prisma.channel.findMany({
      where: this.channelWhere(ctx?.userId),
    });
    const channel = channels.find((c) =>
      c.models.split(',').includes(body.model),
    );

    if (!channel)
      throw new NotFoundException(
        `No active channel found for model: ${body.model}`,
      );

    const payload = {
      model: body.model,
      prompt: body.prompt,
      n: body.n ?? 1,
      size: body.size ?? '1024x1024',
      quality: body.quality ?? 'standard',
    };

    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${channel.baseUrl}/v1/images/generations`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${channel.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      );
      const latencyMs = Date.now() - startTime;

      return {
        images: response.data.data || [],
        latencyMs,
        model: body.model,
        channel: { id: channel.id, name: channel.name, type: channel.type },
      };
    } catch (error: any) {
      if (error.response) {
        const upstreamError =
          error.response.data?.error?.message ||
          error.response.data ||
          'Upstream provider error';
        throw new HttpException(
          { error: { message: upstreamError, type: 'upstream_error' } },
          error.response.status,
        );
      }
      if (error.request) {
        throw new HttpException(
          {
            error: {
              message: 'Upstream provider unreachable',
              type: 'gateway_timeout',
            },
          },
          502,
        );
      }
      throw new HttpException(
        { error: { message: 'Internal proxy error', type: 'internal_error' } },
        500,
      );
    }
  }

  async playgroundVideo(
    body: {
      model: string;
      prompt: string;
      size?: string;
      duration?: number;
      n?: number;
    },
    ctx?: { userId?: number },
  ) {
    const channels = await this.prisma.channel.findMany({
      where: this.channelWhere(ctx?.userId),
    });
    const channel = channels.find((c) =>
      c.models.split(',').includes(body.model),
    );

    if (!channel)
      throw new NotFoundException(
        `No active channel found for model: ${body.model}`,
      );

    const payload = {
      model: body.model,
      prompt: body.prompt,
      n: body.n ?? 1,
      size: body.size ?? '1024x1024',
      duration: body.duration ?? 5,
    };

    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${channel.baseUrl}/v1/video/generations`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${channel.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 300000,
        },
      );
      const latencyMs = Date.now() - startTime;

      return {
        videos: response.data.data || [],
        latencyMs,
        model: body.model,
        channel: { id: channel.id, name: channel.name, type: channel.type },
      };
    } catch (error: any) {
      if (error.response) {
        const upstreamError =
          error.response.data?.error?.message ||
          error.response.data ||
          'Upstream provider error';
        throw new HttpException(
          { error: { message: upstreamError, type: 'upstream_error' } },
          error.response.status,
        );
      }
      if (error.request) {
        throw new HttpException(
          {
            error: {
              message: 'Upstream provider unreachable',
              type: 'gateway_timeout',
            },
          },
          502,
        );
      }
      throw new HttpException(
        { error: { message: 'Internal proxy error', type: 'internal_error' } },
        500,
      );
    }
  }

  async playgroundAudio(
    body: {
      model: string;
      input: string;
      voice?: string;
      speed?: number;
      format?: string;
    },
    ctx?: { userId?: number },
  ) {
    const channels = await this.prisma.channel.findMany({
      where: this.channelWhere(ctx?.userId),
    });
    const channel = channels.find((c) =>
      c.models.split(',').includes(body.model),
    );

    if (!channel)
      throw new NotFoundException(
        `No active channel found for model: ${body.model}`,
      );

    const payload = {
      model: body.model,
      input: body.input,
      voice: body.voice ?? 'alloy',
      speed: body.speed ?? 1.0,
      response_format: body.format ?? 'mp3',
    };

    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${channel.baseUrl}/v1/audio/speech`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${channel.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 60000,
        },
      );
      const latencyMs = Date.now() - startTime;

      // Return audio as base64
      const audioBase64 = Buffer.from(response.data).toString('base64');

      return {
        audio: audioBase64,
        format: payload.response_format,
        latencyMs,
        model: body.model,
        channel: { id: channel.id, name: channel.name, type: channel.type },
      };
    } catch (error: any) {
      if (error.response) {
        const upstreamError =
          error.response.data?.error?.message ||
          error.response.data ||
          'Upstream provider error';
        throw new HttpException(
          { error: { message: upstreamError, type: 'upstream_error' } },
          error.response.status,
        );
      }
      if (error.request) {
        throw new HttpException(
          {
            error: {
              message: 'Upstream provider unreachable',
              type: 'gateway_timeout',
            },
          },
          502,
        );
      }
      throw new HttpException(
        { error: { message: 'Internal proxy error', type: 'internal_error' } },
        500,
      );
    }
  }
}
