<template>
  <div class="playground">
    <!-- Left Panel — Model Configuration -->
    <aside class="config-panel glass-panel">
      <!-- Conversation Selector -->
      <div class="conv-selector" ref="conversationDropdownRef">
        <button class="conv-trigger" @click="showConversationDropdown = !showConversationDropdown" aria-label="对话列表">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="conv-title" :class="{ placeholder: !conversationId }">{{ conversationTitle || '新对话' }}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron-sm" :class="{ open: showConversationDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button class="conv-new-btn" title="新建对话" @click="newConversation">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button class="conv-new-btn" title="导出对话" @click="exportConversation">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <Teleport to="body">
          <div v-if="showConversationDropdown" class="conversation-dropdown glass-panel" :style="convDropdownStyle">
            <div class="conv-dropdown-header">
              <span>历史对话</span>
              <span class="conv-count">{{ conversationList.length }}</span>
            </div>
            <div class="conv-dropdown-list">
              <div
                v-for="conv in conversationList"
                :key="conv.id"
                class="conv-item"
                :class="{ active: conversationId === conv.id }"
                @click="loadConversation(conv.id)"
              >
                <div class="conv-item-main">
                  <span class="conv-item-title">{{ conv.title || '未命名' }}</span>
                  <span class="conv-item-model">{{ conv.model }}</span>
                </div>
                <div class="conv-item-meta">
                  <span class="conv-item-date">{{ formatTime(new Date(conv.updatedAt).getTime()) }}</span>
                  <button class="conv-delete-btn" title="删除" @click="deleteConversation(conv.id, $event)">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
              <div v-if="!conversationList.length" class="conv-empty">暂无历史对话</div>
            </div>
          </div>
        </Teleport>
      </div>

      <div class="panel-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>
        <span>模型配置</span>
      </div>

      <div class="config-body">
        <!-- Model Selector -->
        <div class="config-field">
          <label class="field-label">模型</label>
          <div class="select-wrapper" ref="modelDropdownRef">
            <div ref="modelTriggerRef" class="model-select-trigger" @click="toggleModelDropdown" aria-label="选择模型">
              <ModelIcon v-if="selectedModel" :name="selectedModel" :size="18" />
              <span :class="{ placeholder: !selectedModel }">{{ selectedModel || '选择模型...' }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron" :class="{ open: showModelDropdown }"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <Teleport to="body">
              <div v-if="showModelDropdown" class="model-dropdown glass-panel" :style="dropdownStyle">
                <input
                  ref="modelSearchInput"
                  v-model="modelSearch"
                  class="dropdown-search"
                  placeholder="搜索模型..."
                  @keydown.enter="selectFirstModel"
                />
                <div class="dropdown-list">
                  <div
                    v-for="m in filteredModels"
                    :key="m"
                    class="dropdown-item"
                    :class="{ selected: selectedModel === m }"
                    @mousedown.prevent="selectModel(m)"
                  >
                    <ModelIcon :name="m" :size="16" />
                    <span>{{ m }}</span>
                  </div>
                  <div v-if="!filteredModels.length" class="dropdown-empty">无匹配模型</div>
                </div>
              </div>
            </Teleport>
          </div>
        </div>

        <!-- System Prompt -->
        <div class="config-field">
          <label class="field-label">
            <span>系统提示词</span>
            <select v-model="systemPrompt" class="preset-select" title="选择预设提示词模板">
              <option value="你是一个有帮助的 AI 助手。">默认助手</option>
              <option value="你是一个资深软件工程师，擅长多种编程语言和系统设计。请提供清晰、有注释的代码示例。">代码专家</option>
              <option value="你是一个专业翻译，请将用户输入准确翻译为目标语言，保持原文风格和语气。">翻译官</option>
              <option value="你是一个创意作家，擅长故事创作、文案撰写和内容策划。请用富有感染力的语言回复。">创意作家</option>
            </select>
          </label>
          <FormTextarea v-model="systemPrompt" :rows="4" placeholder="你是一个有帮助的 AI 助手..." label="" />
        </div>

        <!-- Image URL -->
        <div class="config-field">
          <label class="field-label">图片地址</label>
          <FormInput v-model="imageUrl" type="url" placeholder="https://example.com/image.png" label="" />
          <p class="field-hint">添加图片 URL 后，消息将发送给视觉模型进行分析。</p>
        </div>

        <!-- Temperature -->
        <div class="config-field">
          <label class="field-label">
            <span>温度</span>
            <span class="field-value">{{ temperature }}</span>
          </label>
          <input type="range" v-model.number="temperature" min="0" max="2" step="0.05" class="config-slider" />
          <p class="field-hint">控制输出的随机性和创造性。值越高，输出越多样；值越低，输出越确定。</p>
          <div class="slider-marks">
            <span>0</span><span>精确</span><span></span><span></span><span>2</span><span>创意</span>
          </div>
        </div>

        <!-- Max Tokens -->
        <div class="config-field">
          <label class="field-label">最大 Tokens</label>
          <FormNumber v-model="maxTokens" :min="1" :max="131072" :step="256" label="" />
        </div>

        <!-- Streaming Toggle -->
        <div class="config-field">
          <label class="field-label">流式输出</label>
          <SwitchToggle v-model="streamEnabled" :label="streamLabel" />
          <p class="field-hint">流式输出将实时逐字显示 AI 响应。</p>
        </div>

        <!-- Top P -->
        <div class="config-field">
          <label class="field-label">
            <span>Top P</span>
            <span class="field-value">{{ topP }}</span>
          </label>
          <input type="range" v-model.number="topP" min="0" max="1" step="0.05" class="config-slider" />
          <p class="field-hint">核采样，控制词汇选择的多样性。值越低，输出越集中于高概率词汇。</p>
          <div class="slider-marks">
            <span>0</span><span></span><span></span><span></span><span>1</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Center Panel — Chat -->
    <main class="chat-panel">
      <!-- Subtle grid background -->
      <div class="chat-bg"></div>

      <!-- Messages -->
      <div class="chat-messages" ref="messagesContainer" @scroll="handleChatScroll">
        <div v-if="messages.length === 0" class="chat-welcome">
          <div class="welcome-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>操练场</h3>
          <p>选择一个模型，开始对话测试</p>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message-wrapper"
          :class="[msg.role, { 'is-streaming': idx === messages.length - 1 && isTyping }]"
        >
          <div class="message-avatar">
            <template v-if="msg.role === 'error'">
              <div class="avatar-error"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
            </template>
            <template v-else-if="msg.role === 'assistant'">
              <ModelIcon v-if="selectedModel" :name="selectedModel" :size="20" />
              <div v-else class="avatar-fallback">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              </div>
            </template>
            <template v-else>
              <div class="avatar-user">U</div>
            </template>
          </div>

          <div class="message-body">
            <div class="message-bubble">
              <div class="bubble-content" v-html="renderContent(msg.displayContent || msg.content)"></div>
              <div v-if="idx === messages.length - 1 && isTyping" class="typing-cursor">▊</div>
              <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
            </div>

            <!-- Action Buttons -->
            <div class="message-actions">
              <button
                v-if="msg.role === 'user' && !isGenerating"
                class="msg-action-btn"
                title="编辑"
                @click="editMessage(idx)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                v-if="msg.role === 'assistant' && idx === messages.length - 1 && !isGenerating"
                class="msg-action-btn"
                title="重试"
                @click="retryLast"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              </button>
              <button
                v-if="msg.role === 'assistant' || msg.role === 'user'"
                class="msg-action-btn"
                title="复制"
                @click="copyMessage(msg.content)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button
                v-if="!isGenerating"
                class="msg-action-btn danger"
                title="删除"
                @click="deleteMessage(idx)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <!-- Token count badge on assistant messages -->
          <!-- <div v-if="msg.role === 'assistant' && msg.usage" class="token-badge">
            {{ msg.usage.totalTokens?.toLocaleString() }} tokens
          </div> -->
        </div>

        <!-- Generating indicator -->
        <div v-if="isGenerating && !isTyping" class="message-wrapper assistant">
          <div class="message-avatar">
            <ModelIcon v-if="selectedModel" :name="selectedModel" :size="20" />
          </div>
          <div class="message-bubble">
            <div class="thinking-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Scroll to Bottom Button -->
        <button
          v-if="showScrollButton"
          class="scroll-bottom-btn"
          aria-label="滚动到底部"
          @click="scrollToBottom"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <div class="input-container glass-panel">
          <textarea
            ref="chatInputEl"
            v-model="chatInput"
            class="chat-textarea"
            :rows="1"
            placeholder="输入消息..."
            aria-label="输入消息"
            @keydown.enter="handleEnterKey"
            @input="autoResize"
            :disabled="isGenerating"
          ></textarea>
          <button
            class="send-btn"
            :class="{ active: chatInput.trim() && !isGenerating, generating: isGenerating }"
            @click="sendMessage"
            :disabled="!chatInput.trim() || isGenerating"
            aria-label="发送消息"
          >
            <svg v-if="!isGenerating" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            <div v-else class="send-spinner"></div>
          </button>
          <button
            v-if="isGenerating"
            class="stop-btn-inline"
            title="停止生成"
            aria-label="停止生成"
            @click="stopGeneration"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
        </div>
      </div>
    </main>

    <!-- Right Panel — Debug -->
    <aside class="debug-panel glass-panel" :class="{ collapsed: debugCollapsed }">
      <button class="debug-toggle" @click="debugCollapsed = !debugCollapsed" :title="debugCollapsed ? '展开调试' : '隐藏调试'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline v-if="debugCollapsed" points="15 18 9 12 15 6"/>
          <polyline v-else points="9 18 15 12 9 6"/>
        </svg>
      </button>

      <template v-if="!debugCollapsed">
        <div class="panel-header debug-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>调试信息</span>
          <span v-if="lastDebugInfo" class="debug-status" :class="{ error: lastDebugInfo.error }">
            <span class="status-dot" :class="lastDebugInfo.error ? 'status-disabled' : 'status-active'"></span>
            {{ lastDebugInfo.error ? 'Error' : lastDebugInfo.latencyMs + 'ms' }}
          </span>
        </div>

        <div class="debug-body">
          <div v-if="!lastDebugInfo" class="debug-empty">
            <p>发送消息后显示调试信息</p>
          </div>

          <template v-else>
            <!-- Request -->
            <div class="debug-section">
              <div class="debug-section-title" @click="debugSections.request = !debugSections.request">
                <span>请求载荷</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ rotated: !debugSections.request }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <pre v-if="debugSections.request" class="debug-code">{{ formatJSON(lastDebugInfo.request) }}</pre>
            </div>

            <!-- Response -->
            <div class="debug-section">
              <div class="debug-section-title" @click="debugSections.response = !debugSections.response">
                <span>响应数据</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :class="{ rotated: !debugSections.response }"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <pre v-if="debugSections.response" class="debug-code">{{ formatJSON(lastDebugInfo.response) }}</pre>
            </div>

            <!-- Timing -->
            <div class="debug-section">
              <div class="debug-section-title">
                <span>耗时</span>
              </div>
              <div class="debug-stat">
                <span class="debug-stat-label">总延迟</span>
                <span class="debug-stat-value">{{ lastDebugInfo.latencyMs }}ms</span>
              </div>
              <div class="debug-stat">
                <span class="debug-stat-label">模型</span>
                <span class="debug-stat-value mono">{{ lastDebugInfo.model }}</span>
              </div>
              <div class="debug-stat">
                <span class="debug-stat-label">渠道</span>
                <span class="debug-stat-value mono">{{ lastDebugInfo.channel }}</span>
              </div>
            </div>

            <!-- Token Usage -->
            <div class="debug-section">
              <div class="debug-section-title">
                <span>Token 消耗</span>
              </div>
              <div class="debug-stat">
                <span class="debug-stat-label">Prompt</span>
                <span class="debug-stat-value">{{ lastDebugInfo.usage?.promptTokens?.toLocaleString() || 0 }}</span>
              </div>
              <div class="usage-bar">
                <div class="usage-bar-fill prompt" :style="{ width: usagePromptPct + '%' }"></div>
              </div>
              <div class="debug-stat">
                <span class="debug-stat-label">Completion</span>
                <span class="debug-stat-value">{{ lastDebugInfo.usage?.completionTokens?.toLocaleString() || 0 }}</span>
              </div>
              <div class="usage-bar">
                <div class="usage-bar-fill completion" :style="{ width: usageCompletionPct + '%' }"></div>
              </div>
              <div class="debug-stat total">
                <span class="debug-stat-label">总计</span>
                <span class="debug-stat-value accent">{{ lastDebugInfo.usage?.totalTokens?.toLocaleString() || 0 }}</span>
              </div>
              <div class="usage-bar">
                <div class="usage-bar-fill total" :style="{ width: '100%' }"></div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import type { StyleValue } from 'vue';
import api, { apiBaseURL } from '../api';
import type { Channel } from '../types';
import ModelIcon from '../components/ModelIcon.vue';
import SwitchToggle from '../components/SwitchToggle.vue';
import FormInput from '../components/FormInput.vue';
import FormTextarea from '../components/FormTextarea.vue';
import FormNumber from '../components/FormNumber.vue';
import { useToast } from '../composables/useToast';


const toast = useToast();

const streamLabel = computed(() => streamEnabled.value ? '已开启' : '已关闭');

// ── Model Config ──
const channels = ref<Channel[]>([]);
const selectedModel = ref('');
const modelSearch = ref('');
const showModelDropdown = ref(false);
const modelDropdownRef = ref<HTMLElement | null>(null);
const modelTriggerRef = ref<HTMLElement | null>(null);
const modelSearchInput = ref<HTMLInputElement | null>(null);
const systemPrompt = ref('你是一个有帮助的 AI 助手。');
const temperature = ref(0.7);
const maxTokens = ref(4096);
const topP = ref(1.0);
const streamEnabled = ref(false);
const imageUrl = ref('');

const availableModels = computed(() => {
  const set = new Set<string>();
  for (const ch of channels.value) {
    for (const m of ch.models.split(',').map(s => s.trim()).filter(Boolean)) {
      set.add(m);
    }
  }
  return Array.from(set).sort();
});

const filteredModels = computed(() => {
  if (!modelSearch.value) return availableModels.value;
  const q = modelSearch.value.toLowerCase();
  return availableModels.value.filter(m => m.toLowerCase().includes(q));
});

const selectModel = (m: string) => {
  selectedModel.value = m;
  modelSearch.value = '';
  showModelDropdown.value = false;
};

const dropdownStyle = computed<StyleValue>(() => {
  const el = modelTriggerRef.value;
  if (!el) return {};
  const rect = el.getBoundingClientRect();
  return {
    position: 'fixed',
    top: rect.bottom + 4 + 'px',
    left: rect.left + 'px',
    width: rect.width + 'px',
  };
});

const convDropdownStyle = computed<StyleValue>(() => {
  const el = conversationDropdownRef.value;
  if (!el) return {};
  const rect = el.getBoundingClientRect();
  return {
    position: 'fixed',
    top: rect.bottom + 4 + 'px',
    left: rect.left + 'px',
    width: Math.max(rect.width, 260) + 'px',
  };
});

const toggleModelDropdown = () => {
  showModelDropdown.value = !showModelDropdown.value;
  if (showModelDropdown.value) {
    nextTick(() => {
      modelSearchInput.value?.focus();
    });
  }
};

const selectFirstModel = () => {
  if (filteredModels.value.length) selectModel(filteredModels.value[0]);
};

// ── Chat State ──
interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  displayContent?: string;
  timestamp: number;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

const messages = ref<ChatMessage[]>([]);
const chatInput = ref('');
const isGenerating = ref(false);
const isTyping = ref(false);
const isPageLoading = ref(true);
const messagesContainer = ref<HTMLElement | null>(null);
const chatInputEl = ref<HTMLTextAreaElement | null>(null);
let abortGenerating = false;


// ── Scroll-to-bottom ──
const showScrollButton = ref(false);
const handleChatScroll = () => {
  const el = messagesContainer.value;
  if (!el) return;
  showScrollButton.value = el.scrollHeight - el.scrollTop - el.clientHeight > 150;
};

// ── Conversation State ──
const conversationId = ref<number | null>(null);
const conversationTitle = ref('');
const conversationList = ref<{ id: number; title: string; model: string; updatedAt: string }[]>([]);
const showConversationDropdown = ref(false);
const conversationDropdownRef = ref<HTMLElement | null>(null);
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let isSaving = false;
let saveErrorShown = false;

watch(messages, () => {
  if (messages.value.length === 0) return;
  // Debounce: save only after 800ms of no changes (avoids firehose during streaming)
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveConversation();
  }, 800);
}, { deep: true });

// ── Debug State ──
const debugCollapsed = ref(false);
const lastDebugInfo = ref<{
  request: any;
  response: any;
  latencyMs: number;
  model: string;
  channel: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  error?: boolean;
} | null>(null);

const debugSections = ref({ request: true, response: false });

const usagePromptPct = computed(() => {
  const total = lastDebugInfo.value?.usage?.totalTokens || 1;
  return ((lastDebugInfo.value?.usage?.promptTokens || 0) / total) * 100;
});

const usageCompletionPct = computed(() => {
  const total = lastDebugInfo.value?.usage?.totalTokens || 1;
  return ((lastDebugInfo.value?.usage?.completionTokens || 0) / total) * 100;
});

// ── Lifecycle ──
const fetchChannels = async () => {
  try {
    const res = await api.get('/channels');
    channels.value = res.data;
    if (!selectedModel.value && availableModels.value.length) {
      selectedModel.value = availableModels.value[0];
    }
  } catch (err: any) {
    toast.error('加载模型列表失败: ' + (err.response?.data?.message || err.message));
  }
};

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    toggleModelDropdown();
  }
};

onMounted(async () => {
  await fetchChannels();
  await fetchConversations();
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleGlobalKeydown);
});

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;
  // Check model dropdown
  const clickedModelTrigger = modelDropdownRef.value?.contains(target);
  const clickedModelDropdown = (target as Element)?.closest?.('.model-dropdown');
  if (!clickedModelTrigger && !clickedModelDropdown) {
    showModelDropdown.value = false;
    modelSearch.value = '';
  }
  // Check conversation dropdown
  const clickedConvTrigger = conversationDropdownRef.value?.contains(target);
  const clickedConvDropdown = (target as Element)?.closest?.('.conversation-dropdown');
  if (!clickedConvTrigger && !clickedConvDropdown) {
    showConversationDropdown.value = false;
  }
};

// ── Send Message ──
const handleEnterKey = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
  // Shift+Enter: let default behavior (newline) happen
};

const sendMessage = () => {
  const text = chatInput.value.trim();
  if (!text || isGenerating.value) return;
  if (!selectedModel.value) {
    toast.show('请先选择一个模型', 'info');
    return;
  }
  chatInput.value = '';
  resetTextarea();
  doSend(text);
};

const doSend = async (text: string) => {
  isGenerating.value = true;
  abortGenerating = false;

  const userMsg: ChatMessage = {
    role: 'user',
    content: text,
    displayContent: text,
    timestamp: Date.now(),
  };
  messages.value.push(userMsg);
  scrollToBottom();

  // Build messages array with multimodal support — only attach image to LAST user message
  const formattedMessages = [
    { role: 'system', content: systemPrompt.value },
    ...messages.value.map((m, idx, arr) => {
      const isLastUser = m.role === 'user' && idx === arr.length - 1 && arr[idx].role === 'user';
      if (isLastUser && imageUrl.value) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: m.content },
            { type: 'image_url', image_url: { url: imageUrl.value } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    }),
  ];

  const requestPayload = {
    model: selectedModel.value,
    messages: formattedMessages,
    temperature: temperature.value,
    maxTokens: maxTokens.value,
    topP: topP.value,
    stream: streamEnabled.value,
  };

  if (streamEnabled.value) {
    // Remove stream flag — the /chat/stream endpoint implies streaming
    const { stream, ...streamPayload } = requestPayload;
    await doStreamSend(streamPayload);
  } else {
    await doRegularSend(requestPayload);
  }
  // Save conversation after response is fully processed
  saveConversation();
};

let streamAbortController: AbortController | null = null;

const doStreamSend = async (payload: any) => {
  const controller = new AbortController();
  streamAbortController = controller;
  const startTime = Date.now();

  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${apiBaseURL}/playground/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const aiMsg: ChatMessage = {
      role: 'assistant',
      content: '',
      displayContent: '',
      timestamp: Date.now(),
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
    messages.value.push(aiMsg);
    isTyping.value = true;
    const msgIdx = messages.value.length - 1;
    scrollToBottom();

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            messages.value[msgIdx].content += delta;
            messages.value[msgIdx].displayContent = messages.value[msgIdx].content;
            scrollToBottom();
          }
          if (parsed.usage) {
            const u = parsed.usage;
            messages.value[msgIdx].usage = {
              promptTokens: u.prompt_tokens || 0,
              completionTokens: u.completion_tokens || 0,
              totalTokens: u.total_tokens || 0,
            };
          }
        } catch { /* skip unparseable lines */ }
      }
    }

    const latencyMs = Date.now() - startTime;
    lastDebugInfo.value = {
      request: payload,
      response: { stream: true, content: messages.value[msgIdx].content },
      latencyMs,
      model: selectedModel.value,
      channel: 'stream',
      usage: messages.value[msgIdx].usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };

    isGenerating.value = false;
    isTyping.value = false;
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    const errorContent = err.message || '流式请求失败';
    const errorMsg: ChatMessage = {
      role: 'error',
      content: `❌ 错误: ${errorContent}`,
      displayContent: `❌ 错误: ${errorContent}`,
      timestamp: Date.now(),
    };
    messages.value.push(errorMsg);

    lastDebugInfo.value = {
      request: payload,
      response: { error: errorContent },
      latencyMs: Date.now() - startTime,
      model: selectedModel.value,
      channel: 'error',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      error: true,
    };

    isGenerating.value = false;
    isTyping.value = false;
  } finally {
    streamAbortController = null;
  }
};

const doRegularSend = async (payload: any) => {
  const startTime = Date.now();
  try {
    const res = await api.post('/playground/chat', payload);
    const latencyMs = Date.now() - startTime;
    const data = res.data;

    if (abortGenerating) return;

    const aiContent = data.message?.content || '';
    const usage = data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    const aiMsg: ChatMessage = {
      role: 'assistant',
      content: aiContent,
      displayContent: aiContent,
      timestamp: Date.now(),
      usage,
    };
    messages.value.push(aiMsg);

    lastDebugInfo.value = {
      request: payload,
      response: data,
      latencyMs,
      model: data.model || selectedModel.value,
      channel: data.channel?.name || 'unknown',
      usage,
    };

    isGenerating.value = false;
    isTyping.value = false;

  } catch (err: any) {
    const errorContent = err.response?.data?.error?.message || err.message || '请求失败';
    const errorMsg: ChatMessage = {
      role: 'error',
      content: `❌ 错误: ${errorContent}`,
      displayContent: `❌ 错误: ${errorContent}`,
      timestamp: Date.now(),
    };
    messages.value.push(errorMsg);

    lastDebugInfo.value = {
      request: payload,
      response: err.response?.data || { error: errorContent },
      latencyMs: Date.now() - startTime,
      model: selectedModel.value,
      channel: 'error',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      error: true,
    };

    isGenerating.value = false;
    isTyping.value = false;
  }
  scrollToBottom();
};

const stopGeneration = () => {
  abortGenerating = true;
  if (streamAbortController) {
    streamAbortController.abort();
    streamAbortController = null;
  }
  isGenerating.value = false;
  isTyping.value = false;
};

// ── Message Actions ──
const retryLast = () => {
  const lastUserIdx = messages.value.map(m => m.role).lastIndexOf('user');
  if (lastUserIdx === -1) return;
  const lastUserContent = messages.value[lastUserIdx].content;
  // Remove from the last user message onward
  messages.value = messages.value.slice(0, lastUserIdx);
  // Re-send with the stored content
  doSend(lastUserContent);
};

const copyMessage = async (text: string) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    toast.success('已复制到剪贴板');
  } catch {
    toast.error('复制失败');
  }
};

const editMessage = (idx: number) => {
  if (!confirm("编辑此消息将删除后续所有对话，确定继续？")) return;
  chatInput.value = messages.value[idx].content;
  // Remove from this message onward
  messages.value = messages.value.slice(0, idx);
  nextTick(() => {
    chatInputEl.value?.focus();
    autoResize();
  });
};

const deleteMessage = (idx: number) => {
  if (!confirm("确定删除此消息及后续对话？")) return;
  messages.value = messages.value.slice(0, idx);
};

// ── Conversation Persistence ──
const buildSavePayload = () => ({
  title: conversationTitle.value || messages.value.find(m => m.role === 'user')?.content?.slice(0, 50) || 'Untitled',
  messages: messages.value.map(m => ({ role: m.role, content: m.content, usage: m.usage })),
  model: selectedModel.value,
  systemPrompt: systemPrompt.value,
  temperature: temperature.value,
  maxTokens: maxTokens.value,
  topP: topP.value,
  streamEnabled: streamEnabled.value,
  debugInfo: lastDebugInfo.value ? JSON.stringify(lastDebugInfo.value) : undefined,
  imageUrl: imageUrl.value || undefined,
});

const saveConversation = async () => {
  if (isSaving) return;
  isSaving = true;
  try {
    if (!conversationId.value) {
      conversationId.value = await createConversation();
      return;
    }
    await api.put(`/conversations/${conversationId.value}`, buildSavePayload());
  } catch {
    // Debounce error toasts to avoid spam during streaming
    if (!saveErrorShown) {
      saveErrorShown = true;
      toast.error('自动保存失败');
      setTimeout(() => { saveErrorShown = false; }, 10000);
    }
  }
  finally {
    isSaving = false;
  }
};

const createConversation = async (): Promise<number | null> => {
  try {
    const res = await api.post('/conversations', buildSavePayload());
    conversationTitle.value = res.data.title || '';
    return res.data.id;
  } catch {
    return null;
  }
};

const fetchConversations = async () => {
  try {
    const res = await api.get('/conversations', { params: { limit: 20 } });
    conversationList.value = res.data.items || [];
  } catch { /* silent */ }
};

const loadConversation = async (id: number) => {
  try {
    const res = await api.get(`/conversations/${id}`);
    const data = res.data;
    // Parse stored messages
    const rawMessages = typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages;
    messages.value = (rawMessages as any[]).map((m: any) => ({
      role: m.role,
      content: m.content,
      displayContent: m.role === 'assistant' ? m.content : (m.displayContent || m.content),
      timestamp: Date.now(),
      usage: m.usage,
    }));
    conversationId.value = data.id;
    conversationTitle.value = data.title || '';
    selectedModel.value = data.model || selectedModel.value;
    if (data.systemPrompt) systemPrompt.value = data.systemPrompt;
    // Restore config
    temperature.value = data.temperature ?? 0.7;
    maxTokens.value = data.maxTokens ?? 4096;
    topP.value = data.topP ?? 1.0;
    streamEnabled.value = data.streamEnabled ?? false;
    // Restore debug info
    if (data.debugInfo) {
      try {
        lastDebugInfo.value = typeof data.debugInfo === 'string' ? JSON.parse(data.debugInfo) : data.debugInfo;
      } catch { /* ignore corrupt debug info */ }
    } else {
      lastDebugInfo.value = null;
    }
    if (data.imageUrl) {
      imageUrl.value = data.imageUrl;
    } else {
      imageUrl.value = '';
    }
    showConversationDropdown.value = false;
    nextTick(() => scrollToBottom());
  } catch (err: any) {
    toast.show('加载对话失败: ' + (err.response?.data?.message || err.message), 'error');
  }
};

const newConversation = () => {
  conversationId.value = null;
  conversationTitle.value = '';
  messages.value = [];
  imageUrl.value = '';
  showConversationDropdown.value = false;
};

const exportConversation = () => {
  if (messages.value.length === 0) {
    toast.show('没有可导出的对话', 'warning');
    return;
  }
  const md = messages.value.map(m => {
    const roleLabel = m.role === 'user' ? 'User' : m.role === 'assistant' ? selectedModel.value : 'Error';
    return `### ${roleLabel}\n\n${m.content}\n`;
  }).join('\n---\n\n');
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `conversation-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('对话已导出');
};

const deleteConversation = async (id: number, event: Event) => {
  event.stopPropagation();
  try {
    await api.delete(`/conversations/${id}`);
    conversationList.value = conversationList.value.filter(c => c.id !== id);
    if (conversationId.value === id) {
      newConversation();
    }
    toast.show('对话已删除', 'success');
  } catch (err: any) {
    toast.show('删除失败: ' + (err.response?.data?.message || err.message), 'error');
  }
};

// ── Helpers ──
const scrollToBottom = () => {
  nextTick(() => {
    const el = messagesContainer.value;
    if (el) {
      el.scrollTop = el.scrollHeight;
      showScrollButton.value = false;
    }
  });
};

const autoResize = () => {
  const el = chatInputEl.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
};

const resetTextarea = () => {
  const el = chatInputEl.value;
  if (!el) return;
  el.style.height = 'auto';
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

const formatJSON = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

// Simple markdown-like rendering for code blocks
const renderContent = (text: string): string => {
  if (!text) return '';
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Code blocks ```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
  });
  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Images (markdown style)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="chat-image" loading="lazy" />');
  // Strip trailing \n\n after images
  html = html.replace(/(<img[^>]+class="chat-image"[^>]*>)\n\n/g, '$1');
  // Newlines to <br>
  html = html.replace(/\n/g, '<br>');
  return html;
};
</script>

<style scoped>
/* ============================================
   Layout
   ============================================ */
.playground {
  display: flex;
  height: calc(100vh - 56px - 56px); /* minus header + padding */
  gap: 0;
  overflow: hidden;
}

/* ============================================
   Left Panel — Config
   ============================================ */
.config-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  border-right: none;
  overflow: hidden;
}

/* ── Conversation Selector ── */
.conv-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.conv-trigger {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border-subtle);
  background: var(--bg-raised);
  color: var(--text-primary);
  font-size: 0.78rem;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  min-width: 0;
}

.conv-trigger:hover {
  border-color: var(--border);
  background: var(--bg-overlay);
}

.conv-trigger svg:first-child {
  color: var(--accent-blue);
  flex-shrink: 0;
  opacity: 0.7;
}

.conv-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  line-height: 1.3;
}

.conv-title.placeholder {
  color: var(--text-muted);
}

.chevron-sm {
  flex-shrink: 0;
  transition: transform 0.2s;
  opacity: 0.5;
}

.chevron-sm.open {
  transform: rotate(180deg);
}

.conv-new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius);
  border: 1px solid var(--border-subtle);
  background: var(--bg-raised);
  color: var(--accent-blue);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  flex-shrink: 0;
}

.conv-new-btn:hover {
  background: var(--bg-overlay);
  border-color: var(--border);
}

/* Conversation Dropdown */
.conversation-dropdown {
  position: fixed;
  z-index: 9999;
  max-height: 340px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.conv-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
}

.conv-count {
  font-size: 0.7rem;
  background: var(--bg-raised);
  padding: 2px 7px;
  border-radius: 10px;
  color: var(--text-muted);
}

.conv-dropdown-list {
  overflow-y: auto;
  flex: 1;
}

.conv-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--border-subtle);
}

.conv-item:last-child {
  border-bottom: none;
}

.conv-item:hover {
  background: var(--bg-overlay);
}

.conv-item.active {
  background: var(--accent-blue);
  background: rgba(59, 130, 246, 0.1);
}

.conv-item.active .conv-item-title {
  color: var(--accent-blue);
}

.conv-item-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.conv-item-title {
  font-size: 0.8rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-item-model {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.conv-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-item-date {
  font-size: 0.65rem;
  color: var(--text-muted);
  opacity: 0.7;
}

.conv-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.conv-item:hover .conv-delete-btn {
  opacity: 0.6;
}

.conv-delete-btn:hover {
  opacity: 1 !important;
  color: var(--accent-red);
}

.conv-empty {
  padding: 20px 14px;
  text-align: center;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.panel-header svg {
  color: var(--accent-blue);
  opacity: 0.8;
}

.config-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-body :deep(.form-group) {
  margin-bottom: 0;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-value {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--accent-blue);
  background: rgba(59, 130, 246, 0.08);
  padding: 1px 6px;
  border-radius: 4px;
}

.preset-select {
  font-size: 0.65rem;
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-muted);
  cursor: pointer;
  max-width: 90px;
  text-overflow: ellipsis;
}

/* Model Selector */
.select-wrapper {
  position: relative;
}

.model-select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.82rem;
  font-family: var(--font-mono);
  transition: border-color 0.2s;
}

.model-select-trigger:hover {
  border-color: var(--border-accent);
}

.model-select-trigger .placeholder {
  color: var(--text-muted);
}

.chevron {
  margin-left: auto;
  transition: transform 0.2s;
  opacity: 0.5;
}

.chevron.open {
  transform: rotate(180deg);
}

.model-dropdown {
  z-index: 9999;
  max-height: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.dropdown-search {
  padding: 8px 12px;
  background: var(--bg-input);
  border: none;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-family: var(--font-mono);
  outline: none;
}

.dropdown-list {
  overflow-y: auto;
  max-height: 180px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.78rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: var(--bg-card-hover);
}

.dropdown-item.selected {
  background: rgba(59, 130, 246, 0.08);
  color: var(--accent-blue);
}

.dropdown-empty {
  padding: 12px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.75rem;
}

/* Sliders */
.config-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--bg-input);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.config-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent-blue);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
  transition: transform 0.15s;
}

.config-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--text-muted);
  padding: 0 2px;
  margin-top: 2px;
}

/* Field hint text */
.field-hint {
  font-size: 0.65rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: 2px;
}

/* ============================================
/* Stop Button Inline */
.stop-btn-inline {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--accent-red);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.stop-btn-inline:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

/* ============================================
   Center Panel — Chat
   ============================================ */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  background: var(--bg-app);
}

/* Subtle grid background */
.chat-bg {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

/* Welcome */
.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--text-muted);
  user-select: none;
}

.welcome-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.06));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-blue);
  margin-bottom: 4px;
}

.chat-welcome h3 {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.chat-welcome p {
  font-size: 0.82rem;
}

/* Message Wrapper */
.message-wrapper {
  display: flex;
  gap: 12px;
  max-width: 85%;
  animation: msgIn 0.3s ease-out;
}

.message-wrapper.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-wrapper.assistant {
  align-self: flex-start;
}

.message-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

@keyframes msgIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Avatar */
.message-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.avatar-user {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-blue), #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.avatar-error {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-red);
}

.avatar-fallback {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

/* Bubble */
.message-bubble {
  position: relative;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--text-primary);
}

.user .message-bubble {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.08));
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px 4px 12px 12px;
}

.message-wrapper.error .message-bubble {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--accent-red);
}
.message-wrapper.error .message-avatar {
  color: var(--accent-red);
}

.bubble-content {
  word-break: break-word;
}

/* Inline code */
.bubble-content :deep(.inline-code) {
  font-family: var(--font-mono);
  font-size: 0.8em;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

/* Code blocks */
.bubble-content :deep(.code-block) {
  margin: 8px 0;
  padding: 12px 14px;
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.5;
}

.bubble-content :deep(.code-block code) {
  font-family: var(--font-mono);
  white-space: pre;
}

/* Chat images — no background/border */
.bubble-content :deep(.chat-image) {
  max-width: 100%;
  max-height: 512px;
  border-radius: 10px;
  margin: 0;
  display: block;
}

/* Typing cursor */
.typing-cursor {
  display: inline;
  color: var(--accent-blue);
  animation: blink 0.8s step-end infinite;
  font-weight: 300;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* Message time */
.message-time {
  font-size: 0.6rem;
  color: var(--text-muted);
  margin-top: 4px;
  text-align: right;
}

.user .message-time {
  text-align: left;
}

/* Message Action Buttons */
.message-actions {
  display: flex;
  gap: 2px;
  margin-top: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.msg-action-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.msg-action-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.msg-action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
}

/* Token badge */
.token-badge {
  align-self: flex-end;
  font-size: 0.6rem;
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  margin-top: 4px;
}

/* Thinking dots */
.thinking-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  background: var(--accent-blue);
  border-radius: 50%;
  animation: dotPulse 1.2s ease-in-out infinite;
}

.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1); }
}

/* ============================================
   Input Area
   ============================================ */
.chat-input-area {
  padding: 16px 32px 20px;
  flex-shrink: 0;
  position: relative;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 14px;
  transition: border-color 0.2s;
}

.input-container:focus-within {
  border-color: var(--border-accent);
}

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  padding: 6px 0;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-family: var(--font-sans);
  line-height: 1.5;
  max-height: 120px;
}

.chat-textarea::placeholder {
  color: var(--text-muted);
}

.chat-textarea:disabled {
  opacity: 0.5;
}

.send-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.send-btn.active {
  background: var(--accent-blue);
  color: white;
}

.send-btn.active:hover {
  filter: brightness(1.1);
  transform: scale(1.05);
}

.send-btn.generating {
  background: var(--accent-blue);
  color: white;
  cursor: wait;
}

.send-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   Right Panel — Debug
   ============================================ */
.debug-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  border-left: none;
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.debug-panel.collapsed {
  width: 44px;
}

.debug-toggle {
  position: absolute;
  left: 12px;
  top: 16px;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  z-index: 2;
  transition: all 0.15s;
}

.debug-toggle:hover {
  color: var(--accent-blue);
  border-color: var(--border-accent);
}

.debug-header {
  padding-left: 46px;
}

.debug-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-family: var(--font-mono);
  color: var(--accent-green);
  margin-left: auto;
}

.debug-status.error {
  color: var(--accent-red);
}

.debug-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 16px;
}

.debug-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 0.78rem;
  text-align: center;
}

.debug-section {
  margin-bottom: 16px;
}

.debug-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  user-select: none;
}

.debug-section-title svg {
  transition: transform 0.2s;
}

.debug-section-title svg.rotated {
  transform: rotate(-90deg);
}

.debug-code {
  background: var(--bg-app);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  line-height: 1.5;
  color: var(--text-secondary);
  overflow-x: auto;
  max-height: 200px;
  white-space: pre-wrap;
  word-break: break-all;
}

.debug-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.75rem;
}

.debug-stat-label {
  color: var(--text-muted);
}

.debug-stat-value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.debug-stat-value.mono {
  font-size: 0.7rem;
}

.debug-stat-value.accent {
  color: var(--accent-blue);
  font-weight: 600;
}

.debug-stat.total {
  border-top: 1px solid var(--border-subtle);
  margin-top: 4px;
  padding-top: 6px;
  font-weight: 600;
}

/* Usage bars */
.usage-bar {
  height: 3px;
  background: var(--bg-input);
  border-radius: 2px;
  margin: 2px 0 6px;
  overflow: hidden;
}

.usage-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.usage-bar-fill.prompt {
  background: var(--accent-orange);
}

.usage-bar-fill.completion {
  background: var(--accent-green);
}

.usage-bar-fill.total {
  background: var(--accent-blue);
}

/* Loading Overlay */
.page-loading {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-app);
}

/* Scroll to Bottom Button */
.scroll-bottom-btn {
  position: sticky;
  bottom: 8px;
  align-self: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.15s;
  z-index: 10;
}
.scroll-bottom-btn:hover {
  color: var(--accent-blue);
  border-color: var(--border-accent);
  background: var(--bg-overlay);
}
</style>
