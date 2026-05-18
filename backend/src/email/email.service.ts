import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn(
        'RESEND_API_KEY not set — email sending is disabled. ' +
        'Verification codes will be logged to console for development.',
      );
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<boolean> {
    // Always log the code as dev fallback
    const devFallback = () => {
      this.logger.warn(`[DEV] Email sending failed — verification code for ${to}: ${code}`);
    };

    if (!this.resend) {
      this.logger.log(`[DEV] Verification code for ${to}: ${code}`);
      return true;
    }

    try {
      const from =
        process.env.EMAIL_FROM ||
        'Nexious API <onboarding@resend.dev>';

      const { error } = await this.resend.emails.send({
        from,
        to,
        subject: '邮箱验证码 - Nexious API',
        html: `
          <div style="max-width:480px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
            <div style="margin-bottom:28px;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;">🛡 Nexious API</span>
            </div>
            <h2 style="color:#ffffff;font-size:22px;margin:0 0 12px;">邮箱验证码</h2>
            <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px;">
              您正在注册 Nexious API 账号，请输入以下验证码完成验证：
            </p>
            <div style="background:#121212;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
              <span style="font-family:'SF Mono',monospace;font-size:32px;font-weight:700;color:#3b82f6;letter-spacing:8px;">${code}</span>
            </div>
            <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0;">
              验证码 5 分钟内有效。如果这不是您的操作，请忽略此邮件。
            </p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        devFallback();
        return true; // Code is stored in memory, dev can read from console
      }

      this.logger.log(`Verification email sent to ${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Email sending error: ${err.message}`);
      devFallback();
      return true; // Code is stored in memory, dev can read from console
    }
  }
}
