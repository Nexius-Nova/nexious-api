<template>
  <div class="docs-layout">
    <!-- Table of Contents Sidebar -->
    <nav class="toc-sidebar">
      <div class="toc-header">
        <h3>目录导航</h3>
      </div>
      <ul class="toc-list">
        <li v-for="item in tocItems" :key="item.id">
          <a
            :href="'#' + item.id"
            :class="{ active: activeSection === item.id }"
            @click.prevent="scrollTo(item.id)"
          >{{ item.label }}</a>
          <ul v-if="item.children" class="toc-sublist">
            <li v-for="child in item.children" :key="child.id">
              <a
                :href="'#' + child.id"
                :class="{ active: activeSection === child.id }"
                @click.prevent="scrollTo(child.id)"
              >{{ child.label }}</a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>

    <!-- Main Content -->
    <main class="docs-main" ref="docsMain">
      <div class="view-header">
        <h2>API 文档</h2>
        <p>Nexious API 网关 — 统一接入大语言模型与多模态生成服务的完整接口说明</p>
      </div>

      <!-- 1. Overview -->
      <section id="overview" class="doc-section glass-panel">
        <h3>概述</h3>
        <p>Nexious API 网关提供兼容 OpenAI 格式的 API 接口，支持文本对话（Chat Completion）、图片生成、视频生成和语音合成等多种模型能力。所有请求均通过统一网关转发至已配置的后端渠道，由网关自动管理负载均衡和故障转移。</p>
        <p>核心特性：</p>
        <ul class="doc-feature-list">
          <li><strong>多供应商支持</strong> — 同时接入 OpenAI、Anthropic、Azure 等多个 AI 服务商</li>
          <li><strong>统一格式</strong> — 所有接口兼容 OpenAI API 格式，无需适配不同厂商</li>
          <li><strong>令牌鉴权</strong> — 通过 Bearer Token 控制访问权限和使用配额</li>
          <li><strong>流式支持</strong> — 文本对话支持 Server-Sent Events (SSE) 流式输出</li>
          <li><strong>请求日志</strong> — 完整记录每次 API 调用的延迟、Token 消耗等信息</li>
        </ul>
      </section>

      <!-- 2. Authentication -->
      <section id="auth" class="doc-section glass-panel">
        <h3>认证方式</h3>
        <p>所有 API 请求需要在 <code>Authorization</code> 请求头中携带有效的 Bearer Token，格式如下：</p>
        <div class="code-block">
          <div class="code-header">
            <span>请求头</span>
            <button class="copy-btn" @click="copyCode('Authorization: Bearer sk-your-token-here')">复制</button>
          </div>
          <pre><code>Authorization: Bearer sk-your-token-here</code></pre>
        </div>
        <p>你可以在 <router-link to="/console/tokens">令牌管理</router-link> 页面创建和管理 API 令牌。令牌支持设置额度限制和过期时间。</p>
        <div class="tip-box warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>请妥善保管你的 API 令牌，不要在客户端代码或公开仓库中暴露。建议通过环境变量注入令牌。</span>
        </div>
      </section>

      <!-- 3. Base URL -->
      <section id="base-url" class="doc-section glass-panel">
        <h3>基础地址</h3>
        <p>所有 API 端点均以此地址为前缀：</p>
        <div class="code-block">
          <div class="code-header">
            <span>基础 URL</span>
            <button class="copy-btn" @click="copyCode(baseUrl)">复制</button>
          </div>
          <pre><code>{{ baseUrl }}</code></pre>
        </div>
        <div class="info-table">
          <div class="info-row">
            <span class="info-label">Content-Type</span>
            <code>application/json</code>
          </div>
          <div class="info-row">
            <span class="info-label">字符编码</span>
            <code>UTF-8</code>
          </div>
        </div>
      </section>

      <!-- 4. Chat Completions -->
      <section id="chat" class="doc-section glass-panel">
        <h3>聊天补全 <span class="endpoint-tag post">POST</span></h3>
        <p>兼容 OpenAI Chat Completions API 格式的文本对话接口，用于与大型语言模型进行多轮对话。</p>

        <div class="endpoint-bar">
          <span class="method post">POST</span>
          <code>/api/v1/chat/completions</code>
        </div>

        <h4>请求参数</h4>
        <div class="params-table-wrapper">
          <table class="params-table">
            <thead>
              <tr>
                <th>参数</th>
                <th>类型</th>
                <th>必填</th>
                <th>默认值</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>model</code></td>
                <td>string</td>
                <td class="required">是</td>
                <td>—</td>
                <td>模型名称，例如 <code>gpt-4o</code>、<code>claude-3-opus</code></td>
              </tr>
              <tr>
                <td><code>messages</code></td>
                <td>array</td>
                <td class="required">是</td>
                <td>—</td>
                <td>对话消息列表，每条消息包含 <code>role</code> 和 <code>content</code></td>
              </tr>
              <tr>
                <td><code>stream</code></td>
                <td>boolean</td>
                <td>否</td>
                <td>false</td>
                <td>是否启用 SSE 流式响应</td>
              </tr>
              <tr>
                <td><code>max_tokens</code></td>
                <td>integer</td>
                <td>否</td>
                <td>模型默认值</td>
                <td>生成文本的最大 Token 数量</td>
              </tr>
              <tr>
                <td><code>temperature</code></td>
                <td>number</td>
                <td>否</td>
                <td>1</td>
                <td>采样温度，范围 <code>0</code>–<code>2</code>，越高输出越随机</td>
              </tr>
              <tr>
                <td><code>top_p</code></td>
                <td>number</td>
                <td>否</td>
                <td>1</td>
                <td>核采样 (Nucleus Sampling)，取值范围 <code>0</code>–<code>1</code></td>
              </tr>
              <tr>
                <td><code>n</code></td>
                <td>integer</td>
                <td>否</td>
                <td>1</td>
                <td>为每条输入生成多少条候选回复</td>
              </tr>
              <tr>
                <td><code>stop</code></td>
                <td>string | array</td>
                <td>否</td>
                <td>—</td>
                <td>停止词，遇到时立即停止生成</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>Message 对象结构</h4>
        <div class="params-table-wrapper">
          <table class="params-table">
            <thead>
              <tr><th>字段</th><th>类型</th><th>必填</th><th>说明</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><code>role</code></td>
                <td>string</td>
                <td class="required">是</td>
                <td>角色：<code>system</code>、<code>user</code>、<code>assistant</code></td>
              </tr>
              <tr>
                <td><code>content</code></td>
                <td>string | array</td>
                <td class="required">是</td>
                <td>消息文本内容，或多模态内容数组</td>
              </tr>
              <tr>
                <td><code>name</code></td>
                <td>string</td>
                <td>否</td>
                <td>消息发送者名称，用于区分同一角色的不同说话人</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>请求示例</h4>
        <div class="code-block">
          <div class="code-header">
            <span>cURL</span>
            <button class="copy-btn" @click="copyCode(curlExample)">复制</button>
          </div>
          <pre><code>{{ curlExample }}</code></pre>
        </div>

        <h4>响应示例（非流式）</h4>
        <div class="code-block">
          <div class="code-header">
            <span>200 OK — application/json</span>
            <button class="copy-btn" @click="copyCode(responseExample)">复制</button>
          </div>
          <pre><code>{{ responseExample }}</code></pre>
        </div>

        <h4>响应字段说明</h4>
        <div class="params-table-wrapper">
          <table class="params-table">
            <thead>
              <tr><th>字段</th><th>类型</th><th>说明</th></tr>
            </thead>
            <tbody>
              <tr><td><code>id</code></td><td>string</td><td>本次请求的唯一标识符</td></tr>
              <tr><td><code>object</code></td><td>string</td><td>固定为 <code>chat.completion</code></td></tr>
              <tr><td><code>created</code></td><td>integer</td><td>Unix 时间戳（秒）</td></tr>
              <tr><td><code>model</code></td><td>string</td><td>实际使用的模型名称</td></tr>
              <tr><td><code>choices</code></td><td>array</td><td>生成的回复列表</td></tr>
              <tr><td><code>usage</code></td><td>object</td><td>Token 用量统计</td></tr>
              <tr><td><code>choices[].index</code></td><td>integer</td><td>回复序号（从 0 开始）</td></tr>
              <tr><td><code>choices[].message.role</code></td><td>string</td><td>固定为 <code>assistant</code></td></tr>
              <tr><td><code>choices[].message.content</code></td><td>string</td><td>模型生成的回复文本</td></tr>
              <tr><td><code>choices[].finish_reason</code></td><td>string</td><td>结束原因：<code>stop</code> / <code>length</code> / <code>content_filter</code></td></tr>
              <tr><td><code>usage.prompt_tokens</code></td><td>integer</td><td>输入消息消耗的 Token 数</td></tr>
              <tr><td><code>usage.completion_tokens</code></td><td>integer</td><td>生成回复消耗的 Token 数</td></tr>
              <tr><td><code>usage.total_tokens</code></td><td>integer</td><td>本次请求总 Token 消耗</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 5. Streaming -->
      <section id="streaming" class="doc-section glass-panel">
        <h3>流式响应 (SSE)</h3>
        <p>设置 <code>stream: true</code> 即可启用流式输出。服务端将以 Server-Sent Events (SSE) 格式逐块返回生成内容。</p>

        <h4>请求方式</h4>
        <div class="code-block">
          <div class="code-header">
            <span>cURL — 流式请求</span>
            <button class="copy-btn" @click="copyCode(curlStreamExample)">复制</button>
          </div>
          <pre><code>{{ curlStreamExample }}</code></pre>
        </div>

        <h4>SSE 数据格式</h4>
        <p>每块数据以 <code>data: </code> 开头，格式为 JSON。流结束时发送 <code>data: [DONE]</code>。</p>
        <div class="code-block">
          <div class="code-header">
            <span>SSE 事件流示例</span>
            <button class="copy-btn" @click="copyCode(streamExample)">复制</button>
          </div>
          <pre><code>{{ streamExample }}</code></pre>
        </div>

        <h4>客户端示例（JavaScript）</h4>
        <div class="code-block">
          <div class="code-header">
            <span>JavaScript — fetch + ReadableStream</span>
            <button class="copy-btn" @click="copyCode(jsSseExample)">复制</button>
          </div>
          <pre><code>{{ jsSseExample }}</code></pre>
        </div>

        <div class="tip-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>流式响应目前不记录使用日志和 Token 用量。如需追踪用量，请使用非流式请求。</span>
        </div>
      </section>

      <!-- 6. Image Generation -->
      <section id="image" class="doc-section glass-panel">
        <h3>图片生成 <span class="endpoint-tag post">POST</span></h3>
        <p>使用 DALL·E 等图像生成模型通过文本描述创建图片。</p>

        <div class="endpoint-bar">
          <span class="method post">POST</span>
          <code>/api/v1/images/generations</code>
        </div>

        <h4>请求参数</h4>
        <div class="params-table-wrapper">
          <table class="params-table">
            <thead>
              <tr>
                <th>参数</th>
                <th>类型</th>
                <th>必填</th>
                <th>默认值</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>model</code></td>
                <td>string</td>
                <td class="required">是</td>
                <td>—</td>
                <td>模型名称，例如 <code>dall-e-3</code></td>
              </tr>
              <tr>
                <td><code>prompt</code></td>
                <td>string</td>
                <td class="required">是</td>
                <td>—</td>
                <td>描述图片内容的文本提示词，最长 4000 字符</td>
              </tr>
              <tr>
                <td><code>n</code></td>
                <td>integer</td>
                <td>否</td>
                <td>1</td>
                <td>生成图片的数量</td>
              </tr>
              <tr>
                <td><code>size</code></td>
                <td>string</td>
                <td>否</td>
                <td>1024×1024</td>
                <td>图片尺寸：<code>1024x1024</code>、<code>1792x1024</code>、<code>1024x1792</code></td>
              </tr>
              <tr>
                <td><code>quality</code></td>
                <td>string</td>
                <td>否</td>
                <td>standard</td>
                <td>图片质量：<code>standard</code> 或 <code>hd</code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>请求示例</h4>
        <div class="code-block">
          <div class="code-header">
            <span>cURL</span>
            <button class="copy-btn" @click="copyCode(curlImageExample)">复制</button>
          </div>
          <pre><code>{{ curlImageExample }}</code></pre>
        </div>

        <h4>响应示例</h4>
        <div class="code-block">
          <div class="code-header">
            <span>200 OK</span>
            <button class="copy-btn" @click="copyCode(imageResponseExample)">复制</button>
          </div>
          <pre><code>{{ imageResponseExample }}</code></pre>
        </div>
      </section>

      <!-- 7. Video Generation -->
      <section id="video" class="doc-section glass-panel">
        <h3>视频生成 <span class="endpoint-tag post">POST</span></h3>
        <p>通过文本描述或参考图片驱动视频生成模型创建短视频。</p>

        <div class="endpoint-bar">
          <span class="method post">POST</span>
          <code>/api/v1/video/generations</code>
        </div>

        <h4>请求参数</h4>
        <div class="params-table-wrapper">
          <table class="params-table">
            <thead>
              <tr>
                <th>参数</th>
                <th>类型</th>
                <th>必填</th>
                <th>默认值</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>model</code></td>
                <td>string</td>
                <td class="required">是</td>
                <td>—</td>
                <td>视频生成模型名称</td>
              </tr>
              <tr>
                <td><code>prompt</code></td>
                <td>string</td>
                <td class="required">是</td>
                <td>—</td>
                <td>描述视频内容的文本提示词</td>
              </tr>
              <tr>
                <td><code>n</code></td>
                <td>integer</td>
                <td>否</td>
                <td>1</td>
                <td>生成视频的数量</td>
              </tr>
              <tr>
                <td><code>size</code></td>
                <td>string</td>
                <td>否</td>
                <td>1024×1024</td>
                <td>视频分辨率，如 <code>1024x1024</code>、<code>1920x1080</code></td>
              </tr>
              <tr>
                <td><code>duration</code></td>
                <td>integer</td>
                <td>否</td>
                <td>5</td>
                <td>视频时长（秒），取决于模型支持范围</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>请求示例</h4>
        <div class="code-block">
          <div class="code-header">
            <span>cURL</span>
            <button class="copy-btn" @click="copyCode(curlVideoExample)">复制</button>
          </div>
          <pre><code>{{ curlVideoExample }}</code></pre>
        </div>

        <h4>响应示例</h4>
        <div class="code-block">
          <div class="code-header">
            <span>200 OK</span>
            <button class="copy-btn" @click="copyCode(videoResponseExample)">复制</button>
          </div>
          <pre><code>{{ videoResponseExample }}</code></pre>
        </div>
      </section>

      <!-- 8. Audio Speech -->
      <section id="audio" class="doc-section glass-panel">
        <h3>语音合成 <span class="endpoint-tag post">POST</span></h3>
        <p>将文本转换为自然流畅的语音音频（Text-to-Speech）。</p>

        <div class="endpoint-bar">
          <span class="method post">POST</span>
          <code>/api/v1/audio/speech</code>
        </div>

        <h4>请求参数</h4>
        <div class="params-table-wrapper">
          <table class="params-table">
            <thead>
              <tr>
                <th>参数</th>
                <th>类型</th>
                <th>必填</th>
                <th>默认值</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>model</code></td>
                <td>string</td>
                <td class="required">是</td>
                <td>—</td>
                <td>TTS 模型名称，例如 <code>tts-1</code>、<code>tts-1-hd</code></td>
              </tr>
              <tr>
                <td><code>input</code></td>
                <td>string</td>
                <td class="required">是</td>
                <td>—</td>
                <td>要转换为语音的文本内容，最长 4096 字符</td>
              </tr>
              <tr>
                <td><code>voice</code></td>
                <td>string</td>
                <td>否</td>
                <td>alloy</td>
                <td>语音音色：<code>alloy</code>、<code>echo</code>、<code>fable</code>、<code>onyx</code>、<code>nova</code>、<code>shimmer</code></td>
              </tr>
              <tr>
                <td><code>speed</code></td>
                <td>number</td>
                <td>否</td>
                <td>1.0</td>
                <td>语速倍率，范围 <code>0.25</code>–<code>4.0</code></td>
              </tr>
              <tr>
                <td><code>format</code></td>
                <td>string</td>
                <td>否</td>
                <td>mp3</td>
                <td>输出音频格式：<code>mp3</code>、<code>opus</code>、<code>aac</code>、<code>flac</code>、<code>wav</code>、<code>pcm</code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>请求示例</h4>
        <div class="code-block">
          <div class="code-header">
            <span>cURL</span>
            <button class="copy-btn" @click="copyCode(curlAudioExample)">复制</button>
          </div>
          <pre><code>{{ curlAudioExample }}</code></pre>
        </div>

        <h4>响应说明</h4>
        <p>接口返回 Base64 编码的音频数据及元信息：</p>
        <div class="code-block">
          <div class="code-header">
            <span>200 OK</span>
            <button class="copy-btn" @click="copyCode(audioResponseExample)">复制</button>
          </div>
          <pre><code>{{ audioResponseExample }}</code></pre>
        </div>

        <div class="tip-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>音频以 Base64 字符串返回，解码后可保存为文件或直接播放。format 字段指示原始音频编码格式。</span>
        </div>
      </section>

      <!-- 9. Available Models -->
      <section id="models" class="doc-section glass-panel">
        <h3>可用模型</h3>
        <p>系统中可用的模型列表取决于已配置的渠道和令牌权限。你可以通过以下方式查看：</p>
        <ul class="doc-list">
          <li>在 <router-link to="/models">模型广场</router-link> 页面浏览所有可用模型、供应商及支持的模型类型</li>
          <li>在 <router-link to="/console/channels">渠道管理</router-link> 页面配置新的模型渠道和供应商</li>
          <li>模型按类型分类：<strong>文本</strong>（chat/completions）、<strong>图片</strong>（images/generations）、<strong>视频</strong>（video/generations）、<strong>音频</strong>（audio/speech）</li>
        </ul>
      </section>

      <!-- 10. Rate Limiting -->
      <section id="rate-limit" class="doc-section glass-panel">
        <h3>速率限制</h3>
        <p>API 网关根据令牌配额对请求进行速率限制，以确保服务稳定性和公平使用。</p>
        <div class="params-table-wrapper">
          <table class="params-table">
            <thead>
              <tr><th>限制类型</th><th>说明</th></tr>
            </thead>
            <tbody>
              <tr><td>请求频率</td><td>每个令牌每分钟最大请求数，可在令牌管理页面配置</td></tr>
              <tr><td>Token 配额</td><td>每个令牌可消耗的总 Token 数量上限</td></tr>
              <tr><td>并发限制</td><td>同一令牌同时处理的请求数量限制</td></tr>
              <tr><td>过期时间</td><td>令牌到达过期时间后自动禁用，请求返回 401</td></tr>
            </tbody>
          </table>
        </div>
        <p>超出限制时 API 返回 <strong>HTTP 429 Too Many Requests</strong> 状态码。</p>
      </section>

      <!-- 11. Error Codes -->
      <section id="errors" class="doc-section glass-panel">
        <h3>错误码说明</h3>
        <p>API 使用标准 HTTP 状态码表示请求结果。错误响应体包含 JSON 格式的错误详情。</p>

        <div class="params-table-wrapper">
          <table class="params-table">
            <thead>
              <tr>
                <th>状态码</th>
                <th>含义</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code class="status-code status-200">200</code></td>
                <td>OK</td>
                <td>请求成功</td>
              </tr>
              <tr>
                <td><code class="status-code status-400">400</code></td>
                <td>Bad Request</td>
                <td>请求参数错误或缺失必填字段</td>
              </tr>
              <tr>
                <td><code class="status-code status-401">401</code></td>
                <td>Unauthorized</td>
                <td>Token 无效、已禁用或已过期</td>
              </tr>
              <tr>
                <td><code class="status-code status-404">404</code></td>
                <td>Not Found</td>
                <td>请求的模型在所有活跃渠道中均不存在</td>
              </tr>
              <tr>
                <td><code class="status-code status-429">429</code></td>
                <td>Too Many Requests</td>
                <td>请求频率超限或 Token 配额已用尽</td>
              </tr>
              <tr>
                <td><code class="status-code status-500">500</code></td>
                <td>Internal Error</td>
                <td>网关内部异常</td>
              </tr>
              <tr>
                <td><code class="status-code status-502">502</code></td>
                <td>Bad Gateway</td>
                <td>上游渠道服务不可达或响应异常</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>错误响应格式</h4>
        <div class="code-block">
          <div class="code-header">
            <span>JSON</span>
            <button class="copy-btn" @click="copyCode(errorExample)">复制</button>
          </div>
          <pre><code>{{ errorExample }}</code></pre>
        </div>
      </section>

      <!-- 12. SDK / Client Examples -->
      <section id="sdk" class="doc-section glass-panel">
        <h3>SDK 与客户端集成</h3>
        <p>由于接口兼容 OpenAI 格式，你可以直接使用 OpenAI 官方 SDK 接入，仅需修改 <code>baseURL</code> 和 <code>apiKey</code>。</p>

        <h4>Python (OpenAI SDK)</h4>
        <div class="code-block">
          <div class="code-header">
            <span>Python</span>
            <button class="copy-btn" @click="copyCode(pythonSdkExample)">复制</button>
          </div>
          <pre><code>{{ pythonSdkExample }}</code></pre>
        </div>

        <h4>Node.js (OpenAI SDK)</h4>
        <div class="code-block">
          <div class="code-header">
            <span>Node.js</span>
            <button class="copy-btn" @click="copyCode(nodeSdkExample)">复制</button>
          </div>
          <pre><code>{{ nodeSdkExample }}</code></pre>
        </div>

        <h4>Python — 图片生成</h4>
        <div class="code-block">
          <div class="code-header">
            <span>Python — Images</span>
            <button class="copy-btn" @click="copyCode(pythonImageExample)">复制</button>
          </div>
          <pre><code>{{ pythonImageExample }}</code></pre>
        </div>

        <h4>Python — 语音合成</h4>
        <div class="code-block">
          <div class="code-header">
            <span>Python — TTS</span>
            <button class="copy-btn" @click="copyCode(pythonAudioExample)">复制</button>
          </div>
          <pre><code>{{ pythonAudioExample }}</code></pre>
        </div>
      </section>

      <footer class="docs-footer">
        <p>Nexious API Gateway · 有问题？查看 <router-link to="/console/logs">请求日志</router-link> 追踪调用详情。</p>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from '../composables/useToast';

const toast = useToast();
const activeSection = ref('overview');

const baseUrl = window.location.origin;

// ── TOC Items ────────────────────────────────
const tocItems = [
  { id: 'overview', label: '概述' },
  { id: 'auth', label: '认证方式' },
  { id: 'base-url', label: '基础地址' },
  {
    id: 'chat',
    label: '聊天补全',
    children: [
      { id: 'chat', label: 'Chat Completions' },
      { id: 'streaming', label: '流式响应 (SSE)' },
    ],
  },
  { id: 'image', label: '图片生成' },
  { id: 'video', label: '视频生成' },
  { id: 'audio', label: '语音合成' },
  { id: 'models', label: '可用模型' },
  { id: 'rate-limit', label: '速率限制' },
  { id: 'errors', label: '错误码' },
  { id: 'sdk', label: 'SDK 集成' },
];

// ── Scroll / Scroll Spy ──────────────────────
const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeSection.value = id;
  }
};

let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      }
    },
    { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
  );

  document.querySelectorAll('.doc-section').forEach((el) => observer!.observe(el));
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});

// ── Chat Examples ────────────────────────────
const curlExample = `curl ${baseUrl}/api/v1/chat/completions \\
  -H "Authorization: Bearer sk-your-token-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'`;

const responseExample = `{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 28,
    "completion_tokens": 9,
    "total_tokens": 37
  }
}`;

const curlStreamExample = `curl ${baseUrl}/api/v1/chat/completions \\
  -H "Authorization: Bearer sk-your-token-here" \\
  -H "Content-Type: application/json" \\
  -H "Accept: text/event-stream" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }' \\
  --no-buffer`;

const streamExample = `data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"role":"assistant"},"index":0}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{"content":"!"},"index":0}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop","index":0}]}

data: [DONE]`;

const jsSseExample = `// JavaScript — 使用 fetch 处理 SSE 流
const response = await fetch('${baseUrl}/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk-your-token-here',
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
      const chunk = JSON.parse(line.slice(6));
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content); // 逐字输出
    }
  }
}`;

// ── Image Examples ───────────────────────────
const curlImageExample = `curl ${baseUrl}/api/v1/images/generations \\
  -H "Authorization: Bearer sk-your-token-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "dall-e-3",
    "prompt": "A serene mountain lake at sunset, digital art",
    "n": 1,
    "size": "1024x1024",
    "quality": "hd"
  }'`;

const imageResponseExample = `{
  "images": [
    {
      "url": "https://cdn.example.com/generated/img_abc123.png",
      "revised_prompt": "A serene mountain lake reflecting the warm colors of sunset..."
    }
  ],
  "latencyMs": 4521,
  "model": "dall-e-3"
}`;

// ── Video Examples ───────────────────────────
const curlVideoExample = `curl ${baseUrl}/api/v1/video/generations \\
  -H "Authorization: Bearer sk-your-token-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "sora",
    "prompt": "A cat walking through a rainy street at night",
    "size": "1920x1080",
    "duration": 10
  }'`;

const videoResponseExample = `{
  "videos": [
    {
      "url": "https://cdn.example.com/generated/video_xyz.mp4",
      "duration": 10
    }
  ],
  "latencyMs": 45210,
  "model": "sora"
}`;

// ── Audio Examples ───────────────────────────
const curlAudioExample = `curl ${baseUrl}/api/v1/audio/speech \\
  -H "Authorization: Bearer sk-your-token-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "tts-1-hd",
    "input": "你好，欢迎使用 Nexious API 网关！",
    "voice": "alloy",
    "speed": 1.0,
    "format": "mp3"
  }'`;

const audioResponseExample = `{
  "audio": "//uQxAAAE...base64-encoded-audio-data...",
  "format": "mp3",
  "latencyMs": 1234,
  "model": "tts-1-hd"
}`;

// ── Error Example ────────────────────────────
const errorExample = `{
  "error": {
    "message": "No active channel found for model: unknown-model-v1",
    "type": "invalid_request_error"
  }
}`;

// ── SDK Examples ─────────────────────────────
const pythonSdkExample = `# Python — 使用 OpenAI SDK 接入 Nexious
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-token-here",
    base_url="${baseUrl}/api/v1",
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"},
    ],
    temperature=0.7,
    max_tokens=1024,
)

print(response.choices[0].message.content)`;

const nodeSdkExample = `// Node.js — 使用 OpenAI SDK 接入 Nexious
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-your-token-here',
  baseURL: '${baseUrl}/api/v1',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
  temperature: 0.7,
  max_tokens: 1024,
});

console.log(response.choices[0].message.content);`;

const pythonImageExample = `# Python — 使用 Nexious 生成图片
import requests

response = requests.post(
    "${baseUrl}/api/v1/images/generations",
    headers={
        "Authorization": "Bearer sk-your-token-here",
        "Content-Type": "application/json",
    },
    json={
        "model": "dall-e-3",
        "prompt": "A futuristic city skyline at night",
        "size": "1024x1024",
        "quality": "hd",
    },
)

print(response.json())`;

const pythonAudioExample = `# Python — 使用 Nexious 进行语音合成
import requests
import base64

response = requests.post(
    "${baseUrl}/api/v1/audio/speech",
    headers={
        "Authorization": "Bearer sk-your-token-here",
        "Content-Type": "application/json",
    },
    json={
        "model": "tts-1-hd",
        "input": "你好，这是一个测试。",
        "voice": "nova",
        "speed": 1.0,
    },
)

data = response.json()
audio_bytes = base64.b64decode(data["audio"])
with open(f"speech.{data['format']}", "wb") as f:
    f.write(audio_bytes)
print("Audio saved!")`;

// ── Copy ─────────────────────────────────────
const copyCode = (code: string) => {
  navigator.clipboard.writeText(code);
  toast.success('已复制到剪贴板');
};
</script>

<style scoped>
/* ============================================
   Layout
   ============================================ */
.docs-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ============================================
   TOC Sidebar
   ============================================ */
.toc-sidebar {
  width: 270px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-sidebar);
  padding: 24px 0;
  overflow-y: auto;
  position: sticky;
  top: 0;
  height: 100vh;
}

.toc-header {
  padding: 0 22px 18px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 8px;
}

.toc-header h3 {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.toc-list {
  list-style: none;
  padding: 0 16px;
  margin: 0;
}

.toc-list > li {
  margin-bottom: 2px;
}

.toc-list a {
  display: block;
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 0.83rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.15s;
  line-height: 1.4;
}

.toc-list a:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

.toc-list a.active {
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.08);
  font-weight: 500;
}

.toc-sublist {
  list-style: none;
  padding: 0 0 0 14px;
  margin: 0;
}

.toc-sublist a {
  font-size: 0.78rem;
  padding: 5px 12px;
}

/* ============================================
   Main Content
   ============================================ */
.docs-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px 60px;
  max-width: 1000px;
}

.view-header {
  margin-bottom: 32px;
}

.view-header h2 {
  font-size: 1.65rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.view-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ============================================
   Doc Sections
   ============================================ */
.doc-section {
  padding: 28px 32px;
  margin-bottom: 20px;
}

.doc-section h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
}

.doc-section h4 {
  font-size: 0.92rem;
  font-weight: 600;
  margin: 24px 0 10px;
  color: var(--text-secondary);
}

.doc-section h4:first-of-type {
  margin-top: 8px;
}

.doc-section p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: 10px;
}

.doc-section a {
  color: var(--accent-blue);
  text-decoration: underline;
}

.doc-section code {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Endpoint tags */
.endpoint-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.endpoint-tag.post {
  color: var(--accent-green);
  background: rgba(16, 185, 129, 0.1);
}

/* Feature list */
.doc-feature-list {
  padding-left: 20px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 2;
  margin-bottom: 0;
}

.doc-feature-list li strong {
  color: var(--text-primary);
}

/* ============================================
   Endpoint Bar
   ============================================ */
.endpoint-bar {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-sidebar);
  border: 1px solid var(--border-subtle);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.method {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.method.post {
  color: var(--accent-green);
  background: rgba(16, 185, 129, 0.12);
}

/* ============================================
   Info Table (base-url)
   ============================================ */
.info-table {
  margin-top: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  font-size: 0.83rem;
  border-bottom: 1px solid var(--border-subtle);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 110px;
  flex-shrink: 0;
  color: var(--text-muted);
  font-weight: 500;
}

.info-row code {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 8px;
  border-radius: 4px;
}

/* ============================================
   Parameters Table
   ============================================ */
.params-table-wrapper {
  overflow-x: auto;
  margin-bottom: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.params-table th {
  padding: 10px 14px;
  font-size: 0.73rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--border-subtle);
  text-align: left;
  background: var(--bg-sidebar);
  white-space: nowrap;
}

.params-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.params-table tbody tr:last-child td {
  border-bottom: none;
}

.params-table td code {
  font-size: 0.78rem;
}

.required {
  color: var(--accent-red);
  font-weight: 600;
}

/* Status code colors */
.status-code {
  font-weight: 600;
}
.status-200 { color: var(--accent-green); }
.status-400 { color: var(--accent-orange); }
.status-401 { color: var(--accent-red); }
.status-404 { color: var(--accent-orange); }
.status-429 { color: var(--accent-red); }
.status-500 { color: var(--accent-red); }
.status-502 { color: var(--accent-red); }

/* ============================================
   Code Block
   ============================================ */
.code-block {
  background: var(--bg-sidebar);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 14px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.73rem;
  color: var(--text-muted);
}

.copy-btn {
  font-size: 0.73rem;
  color: var(--accent-blue);
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  background: none;
  border: 1px solid transparent;
  transition: all 0.15s;
}

.copy-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
}

.code-block pre {
  padding: 16px;
  overflow-x: auto;
  margin: 0;
}

.code-block code {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.65;
  color: var(--text-primary);
  white-space: pre;
  background: none;
  padding: 0;
}

/* ============================================
   Tip Box
   ============================================ */
.tip-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin-top: 10px;
}

.tip-box.warning {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.18);
}

.tip-box svg {
  flex-shrink: 0;
  color: var(--accent-orange);
  margin-top: 2px;
}

.tip-box.warning svg {
  color: var(--accent-red);
}

/* ============================================
   Doc List
   ============================================ */
.doc-list {
  padding-left: 20px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 2;
}

.doc-list a {
  color: var(--accent-blue);
  text-decoration: underline;
}

/* ============================================
   Footer
   ============================================ */
.docs-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.docs-footer a {
  color: var(--accent-blue);
  text-decoration: underline;
}
</style>
