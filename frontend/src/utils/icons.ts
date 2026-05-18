/**
 * Maps a model name or provider type to a LobeHub icon slug + brand color.
 * Returns null if no matching icon is found.
 */
const BRAND_COLORS: Record<string, string> = {
  openai: '#000000',
  anthropic: '#D97757',
  claude: '#D97757',
  google: '#4285F4',
  gemini: '#4285F4',
  gemma: '#4285F4',
  deepseek: '#4D6BFE',
  meta: '#1877F2',
  mistral: '#F18C02',
  qwen: '#6B5BFA',
  zhipu: '#3B5CE5',
  hunyuan: '#00A4FF',
  doubao: '#3370FF',
  xai: '#FFFFFF',
  cohere: '#39594D',
  yi: '#6D28D9',
  minimax: '#6366F1',
  stepfun: '#7C3AED',
  baichuan: '#2563EB',
  spark: '#1677FF',
  wenxin: '#2932E1',
  aws: '#FF9900',
  ai21labs: '#FF6B6B',
  stability: '#7B2FBE',
  perplexity: '#1DB5A9',
  replicate: '#000000',
  groq: '#F55036',
  together: '#0F6CBD',
  fireworks: '#FF4747',
  cloudflare: '#F38020',
  vercel: '#000000',
  nvidia: '#76B900',
  snowflake: '#29B5E8',
  yandex: '#FF3333',
  azure: '#0089D6',
  ollama: '#FFFFFF',
  dify: '#1C64F2',
  openrouter: '#6E47ED',
  kimi: '#6B5CE7',
  moonshot: '#6B5CE7',
  sensenova: '#3E5CF6',
  skywork: '#5B6AF0',
  internlm: '#3668D9',
  baidu: '#2932E1',
};

interface IconInfo {
  slug: string;
  color: string;
}

const MODEL_ICON_MAP: Record<string, string> = {
  // OpenAI
  'gpt-': 'openai',
  'gpt4': 'openai',
  'gpt3': 'openai',
  'o1-': 'openai',
  'o3-': 'openai',
  'o4-': 'openai',
  'openai': 'openai',
  'dall-e': 'openai',
  'dalle': 'openai',
  'codex': 'openai',
  'whisper': 'openai',
  // Anthropic / Claude
  'claude': 'claude',
  'anthropic': 'anthropic',
  // Google
  'gemini': 'gemini',
  'gemma': 'gemma',
  'palm': 'google',
  'google': 'google',
  'nanobanana': 'google',
  // DeepSeek
  'deepseek': 'deepseek',
  // Meta
  'llama': 'meta',
  'meta': 'meta',
  // Mistral
  'mistral': 'mistral',
  'mixtral': 'mistral',
  'codestral': 'mistral',
  // Qwen / Alibaba
  'qwen': 'qwen',
  'alibaba': 'qwen',
  // Zhipu / GLM
  'glm': 'zhipu',
  'chatglm': 'zhipu',
  'zhipu': 'zhipu',
  // Tencent
  'hunyuan': 'hunyuan',
  // ByteDance
  'doubao': 'doubao',
  // xAI
  'grok': 'xai',
  'xai': 'xai',
  // Cohere
  'command': 'cohere',
  'cohere': 'cohere',
  // 01.AI
  'yi-': 'yi',
  // Minimax
  'minimax': 'minimax',
  // StepFun
  'step': 'stepfun',
  // Baichuan
  'baichuan': 'baichuan',
  // Spark / iFlyTek
  'spark': 'spark',
  // Baidu
  'wenxin': 'wenxin',
  'ernie': 'wenxin',
  // AWS
  'nova': 'aws',
  'titan': 'aws',
  'amazon': 'aws',
  'bedrock': 'aws',
  // AI21 Labs
  'ai21': 'ai21labs',
  'jamba': 'ai21labs',
  // Stability
  'stable': 'stability',
  'stability': 'stability',
  // Perplexity
  'perplexity': 'perplexity',
  // Replicate
  'replicate': 'replicate',
  // Groq
  'groq': 'groq',
  // Together
  'together': 'together',
  // Fireworks
  'fireworks': 'fireworks',
  // Cloudflare
  'cloudflare': 'cloudflare',
  'workers': 'cloudflare',
  // Vercel
  'vercel': 'vercel',
  // NVIDIA
  'nvidia': 'nvidia',
  'nemotron': 'nvidia',
  // Snowflake
  'snowflake': 'snowflake',
  // Yandex
  'yandex': 'yandex',
  // Channel types
  'azure': 'azure',
  'ollama': 'ollama',
  'dify': 'dify',
  'openrouter': 'openrouter',
  // Moonshot / Kimi
  'kimi': 'kimi',
  'moonshot': 'moonshot',
  // Other Chinese providers
  'sensenova': 'sensenova',
  'sensetime': 'sensenova',
  'skywork': 'skywork',
  'internlm': 'internlm',
  'baidu': 'baidu',
  'bytedance': 'doubao',
};

function resolveIconSlug(model: string): string | null {
  const lower = model.toLowerCase();
  for (const [prefix, slug] of Object.entries(MODEL_ICON_MAP)) {
    if (lower.includes(prefix)) return slug;
  }
  return null;
}

export function getIconInfo(name: string): IconInfo | null {
  const slug = resolveIconSlug(name);
  if (!slug) return null;
  const color = BRAND_COLORS[slug] || '#FFFFFF';
  return { slug, color };
}
