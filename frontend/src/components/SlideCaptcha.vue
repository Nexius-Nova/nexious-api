<template>
  <div class="captcha-wrap" :class="{ 'captcha-disabled': disabled }">
    <button
      v-if="!verified"
      type="button"
      class="captcha-trigger"
      :disabled="disabled"
      @click="open"
    >
      <svg class="captcha-trigger-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
        <path d="M7 11V8a5 5 0 0 1 10 0v3"></path>
      </svg>
      <span>点击完成安全验证</span>
      <svg class="captcha-trigger-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18l6-6-6-6"></path>
      </svg>
    </button>

    <div v-else class="captcha-verified-badge">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>
      <span>安全验证已通过</span>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="captcha-modal">
      <div v-if="modalVisible" class="captcha-overlay" @click.self="onOverlayClick">
        <div class="captcha-modal" role="dialog" aria-modal="true" aria-labelledby="captcha-title" @click.stop>
          <div class="captcha-modal-header">
            <div>
              <h3 id="captcha-title">请完成安全验证</h3>
              <p>{{ statusText }}</p>
            </div>
            <div class="captcha-modal-actions">
              <button type="button" class="captcha-icon-btn" title="刷新验证码" @click="refresh" :disabled="verifying">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
                  <path d="M21 3v6h-6"></path>
                </svg>
              </button>
              <button type="button" class="captcha-icon-btn" title="关闭" @click="close">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="captcha-image-area" ref="imageAreaRef">
            <canvas ref="bgCanvasRef" class="captcha-canvas"></canvas>
            <canvas
              ref="pieceCanvasRef"
              class="captcha-piece-canvas"
              :class="{ 'captcha-piece-done': puzzleSuccess }"
              :style="pieceStyle"
            ></canvas>
            <Transition name="captcha-fade">
              <div v-if="puzzleSuccess" class="captcha-success-overlay">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <span>验证通过</span>
              </div>
            </Transition>
          </div>

          <div
            ref="trackRef"
            class="captcha-slider-track"
            :class="{
              'captcha-slider-dragging': dragging,
              'captcha-slider-error': status === 'error',
              'captcha-slider-success': puzzleSuccess,
            }"
          >
            <div class="captcha-fill" :style="{ width: fillWidth + 'px' }"></div>
            <span class="captcha-slider-hint">{{ sliderHint }}</span>
            <button
              ref="btnRef"
              type="button"
              class="captcha-btn"
              :class="{ 'captcha-btn-dragging': dragging, 'captcha-btn-done': puzzleSuccess }"
              :style="{ left: btnLeft + 'px' }"
              :disabled="verifying || puzzleSuccess"
              @mousedown.prevent="onStart"
              @touchstart.prevent="onStart"
              @keydown.left.prevent="nudge(-1)"
              @keydown.right.prevent="nudge(1)"
              @keydown.enter.prevent="checkPosition"
              @keydown.space.prevent="checkPosition"
            >
              <svg v-if="!puzzleSuccess" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 18l6-6-6-6"></path>
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            </button>
          </div>

          <p class="captcha-modal-footer">拖动滑块，让拼图块与缺口完全重合</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue';

const props = withDefaults(defineProps<{
  disabled?: boolean;
}>(), {
  disabled: false,
});

const emit = defineEmits<{
  verified: [token: string];
  reset: [];
}>();

type CaptchaStatus = 'idle' | 'dragging' | 'error' | 'success';

const imageAreaRef = ref<HTMLElement | null>(null);
const bgCanvasRef = ref<HTMLCanvasElement | null>(null);
const pieceCanvasRef = ref<HTMLCanvasElement | null>(null);
const trackRef = ref<HTMLElement | null>(null);
const btnRef = ref<HTMLButtonElement | null>(null);

const modalVisible = ref(false);
const verified = ref(false);
const puzzleSuccess = ref(false);
const verifying = ref(false);
const dragging = ref(false);
const status = ref<CaptchaStatus>('idle');
const btnLeft = ref(0);
const fillWidth = ref(0);
const token = ref('');
const holeX = ref(0);
const holeY = ref(0);
const pieceWidth = ref(50);
const pieceHeight = ref(50);

let sourceImageData: ImageData | null = null;
let maxLeft = 0;
let imageWidth = 0;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let errorTimer: ReturnType<typeof setTimeout> | null = null;
let trackWidth = 0;
let btnWidth = 0;
let startX = 0;
let startLeft = 0;

const statusText = computed(() => {
  if (status.value === 'success') return '已确认本次操作由真人完成';
  if (status.value === 'error') return '位置有偏差，请重新拖动';
  if (dragging.value) return '松手后将自动校验拼图位置';
  return '拖动下方滑块，将拼图块移动到缺口处';
});

const sliderHint = computed(() => {
  if (puzzleSuccess.value) return '验证通过';
  if (status.value === 'error') return '未对齐，请重试';
  if (dragging.value) return '';
  return '按住滑块向右拖动';
});

const pieceLeft = computed(() => {
  if (maxLeft <= 0) return btnLeft.value;
  return (btnLeft.value / maxLeft) * Math.max(0, imageWidth - pieceWidth.value);
});

const pieceStyle = computed(() => ({
  width: pieceWidth.value + 'px',
  height: pieceHeight.value + 'px',
  left: pieceLeft.value + 'px',
  top: holeY.value + 'px',
}));

function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientX;
  return e.clientX;
}

function calcDimensions() {
  if (!trackRef.value || !btnRef.value || !imageAreaRef.value) return;
  trackWidth = trackRef.value.offsetWidth;
  btnWidth = btnRef.value.offsetWidth;
  imageWidth = imageAreaRef.value.offsetWidth;
  maxLeft = Math.max(0, trackWidth - btnWidth);
}

function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  canvas.width = Math.floor(width);
  canvas.height = Math.floor(height);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return ctx;
}

function generateImage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const palettes = [
    ['#102a43', '#1f4e5f', '#6c8c6d', '#d6c7a1'],
    ['#1f2937', '#334155', '#7c2d12', '#d6a15f'],
    ['#172554', '#164e63', '#4b5563', '#cbd5e1'],
    ['#1c1917', '#3f3f46', '#14532d', '#a3a3a3'],
  ];
  const palette = palettes[Math.floor(Math.random() * palettes.length)];

  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 12; i++) {
    ctx.save();
    ctx.translate(Math.random() * w, Math.random() * h);
    ctx.rotate((Math.random() - 0.5) * 1.4);
    ctx.fillStyle = palette[1 + (i % (palette.length - 1))];
    ctx.globalAlpha = 0.28 + Math.random() * 0.18;
    ctx.fillRect(-40 - Math.random() * 40, -12 - Math.random() * 14, 80 + Math.random() * 120, 24 + Math.random() * 34);
    ctx.restore();
  }

  for (let i = 0; i < 55; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = 1 + Math.random() * 2.2;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
    ctx.fillRect(x, y, size, size);
  }

  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (let y = 18; y < h; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.random() * 8);
    ctx.lineTo(w, y + Math.random() * 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function puzzlePiecePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = Math.max(8, Math.floor(w * 0.18));
  const midY = y + h / 2;
  const topKnobStart = x + w * 0.38;
  const topKnobEnd = x + w * 0.62;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(topKnobStart, y);
  ctx.bezierCurveTo(
    topKnobStart + r * 0.25,
    y + r * 0.9,
    topKnobEnd - r * 0.25,
    y + r * 0.9,
    topKnobEnd,
    y,
  );
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, midY - r);
  ctx.bezierCurveTo(
    x + w - r * 0.95,
    midY - r * 0.25,
    x + w - r * 0.95,
    midY + r * 0.25,
    x + w,
    midY + r,
  );
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, midY + r);
  ctx.bezierCurveTo(
    x + r * 0.95,
    midY + r * 0.25,
    x + r * 0.95,
    midY - r * 0.25,
    x,
    midY - r,
  );
  ctx.lineTo(x, y);
  ctx.closePath();
}

function drawHole(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  puzzlePiecePath(ctx, x, y, w, h);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.fill();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawPiece() {
  if (!sourceImageData || !pieceCanvasRef.value) return;
  const canvas = pieceCanvasRef.value;
  const ctx = setupCanvas(canvas, pieceWidth.value, pieceHeight.value);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sourceImageData.width;
  tempCanvas.height = sourceImageData.height;
  tempCanvas.getContext('2d')!.putImageData(sourceImageData, 0, 0);

  ctx.clearRect(0, 0, pieceWidth.value, pieceHeight.value);
  ctx.save();
  puzzlePiecePath(ctx, 0, 0, pieceWidth.value, pieceHeight.value);
  ctx.clip();
  ctx.drawImage(
    tempCanvas,
    holeX.value,
    holeY.value,
    pieceWidth.value,
    pieceHeight.value,
    0,
    0,
    pieceWidth.value,
    pieceHeight.value,
  );
  ctx.restore();

  ctx.save();
  puzzlePiecePath(ctx, 0, 0, pieceWidth.value, pieceHeight.value);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.stroke();
  ctx.restore();
}

function initCanvas() {
  if (!imageAreaRef.value || !bgCanvasRef.value || !pieceCanvasRef.value) return;

  status.value = 'idle';
  puzzleSuccess.value = false;
  verifying.value = false;
  btnLeft.value = 0;
  fillWidth.value = 0;
  token.value = '';
  sourceImageData = null;

  const w = imageAreaRef.value.offsetWidth;
  const h = imageAreaRef.value.offsetHeight;
  const bgCtx = setupCanvas(bgCanvasRef.value, w, h);
  generateImage(bgCtx, w, h);
  sourceImageData = bgCtx.getImageData(0, 0, w, h);

  const size = Math.max(44, Math.min(58, Math.floor(w * 0.16)));
  pieceWidth.value = size;
  pieceHeight.value = size;
  holeX.value = Math.round(size + 24 + Math.random() * Math.max(24, w - size * 2.7 - 48));
  holeY.value = Math.round(22 + Math.random() * Math.max(10, h - size - 44));

  drawHole(bgCtx, holeX.value, holeY.value, pieceWidth.value, pieceHeight.value);
  drawPiece();
}

async function open() {
  if (props.disabled || verified.value) return;
  modalVisible.value = true;
  await nextTick();
  await nextTick();
  initCanvas();
  calcDimensions();
}

function close() {
  if (verifying.value && puzzleSuccess.value) return;
  modalVisible.value = false;
  if (!puzzleSuccess.value) resetPuzzle();
}

function refresh() {
  if (verifying.value) return;
  clearErrorTimer();
  initCanvas();
  calcDimensions();
}

function onOverlayClick() {
  if (verifying.value) return;
  close();
}

function onStart(e: MouseEvent | TouchEvent) {
  if (puzzleSuccess.value || verifying.value) return;
  clearErrorTimer();
  calcDimensions();
  dragging.value = true;
  status.value = 'dragging';
  startX = getClientX(e);
  startLeft = btnLeft.value;

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
}

function onMove(e: MouseEvent | TouchEvent) {
  if (!dragging.value) return;
  e.preventDefault();
  const dx = getClientX(e) - startX;
  updatePosition(startLeft + dx);
}

function onEnd() {
  if (!dragging.value) return;
  dragging.value = false;
  removeDragListeners();
  checkPosition();
}

function updatePosition(nextLeft: number) {
  const left = Math.max(0, Math.min(maxLeft, nextLeft));
  btnLeft.value = left;
  fillWidth.value = left + btnWidth / 2;
}

function nudge(direction: -1 | 1) {
  if (puzzleSuccess.value || verifying.value) return;
  calcDimensions();
  status.value = 'dragging';
  updatePosition(btnLeft.value + direction * 8);
}

function checkPosition() {
  if (puzzleSuccess.value || verifying.value) return;
  const mappedLeft = pieceLeft.value;
  const tolerance = Math.max(5, pieceWidth.value * 0.12);

  if (Math.abs(mappedLeft - holeX.value) <= tolerance) {
    status.value = 'success';
    puzzleSuccess.value = true;
    verifying.value = true;
    const targetLeft = maxLeft > 0 ? (holeX.value / Math.max(1, imageWidth - pieceWidth.value)) * maxLeft : holeX.value;
    updatePosition(targetLeft);
    token.value = generateToken();

    closeTimer = setTimeout(() => {
      modalVisible.value = false;
      verified.value = true;
      verifying.value = false;
      emit('verified', token.value);
    }, 700);
    return;
  }

  status.value = 'error';
  updatePosition(0);
  errorTimer = setTimeout(() => {
    status.value = 'idle';
  }, 900);
}

function removeDragListeners() {
  document.removeEventListener('mousemove', onMove);
  document.removeEventListener('mouseup', onEnd);
  document.removeEventListener('touchmove', onMove);
  document.removeEventListener('touchend', onEnd);
}

function clearErrorTimer() {
  if (errorTimer) {
    clearTimeout(errorTimer);
    errorTimer = null;
  }
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'imgcaptcha_' + result + '_' + Date.now().toString(36);
}

function resetPuzzle() {
  clearErrorTimer();
  puzzleSuccess.value = false;
  verifying.value = false;
  dragging.value = false;
  status.value = 'idle';
  btnLeft.value = 0;
  fillWidth.value = 0;
  token.value = '';
}

function reset() {
  if (closeTimer) clearTimeout(closeTimer);
  modalVisible.value = false;
  verified.value = false;
  resetPuzzle();
  emit('reset');
}

defineExpose({ reset, open, getToken: () => token.value });

onUnmounted(() => {
  if (closeTimer) clearTimeout(closeTimer);
  clearErrorTimer();
  removeDragListeners();
});
</script>

<style scoped>
.captcha-wrap {
  width: 100%;
}

.captcha-disabled {
  opacity: 0.56;
  pointer-events: none;
}

.captcha-trigger,
.captcha-verified-badge {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.captcha-trigger {
  gap: 10px;
  border: 1px solid var(--border-subtle);
  background-color: var(--bg-input);
  color: var(--text-secondary);
}

.captcha-trigger:hover {
  border-color: rgba(var(--accent-blue-rgb), 0.5);
  background-color: rgba(var(--accent-blue-rgb), 0.06);
  color: var(--text-primary);
}

.captcha-trigger:disabled {
  cursor: not-allowed;
}

.captcha-trigger-icon,
.captcha-trigger-arrow,
.captcha-verified-badge svg,
.captcha-icon-btn svg,
.captcha-btn svg,
.captcha-success-overlay svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.captcha-trigger-arrow {
  width: 15px;
  height: 15px;
  margin-left: auto;
}

.captcha-verified-badge {
  gap: 9px;
  border: 1px solid rgba(16, 185, 129, 0.28);
  background-color: rgba(16, 185, 129, 0.08);
  color: var(--accent-green);
  font-weight: 650;
}

.captcha-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(6px);
}

.captcha-modal {
  width: min(390px, 100%);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background-color: var(--bg-card);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.46);
}

.captcha-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.captcha-modal-header h3 {
  color: var(--text-primary);
  font-size: 0.98rem;
  line-height: 1.25;
  letter-spacing: 0;
}

.captcha-modal-header p {
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 0.76rem;
  line-height: 1.4;
}

.captcha-modal-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}

.captcha-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 7px;
  color: var(--text-muted);
}

.captcha-icon-btn:hover {
  background-color: var(--bg-card-hover);
  color: var(--text-primary);
}

.captcha-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.captcha-image-area {
  position: relative;
  width: 100%;
  height: 176px;
  overflow: hidden;
  background-color: var(--bg-input);
}

.captcha-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.captcha-piece-canvas {
  position: absolute;
  z-index: 2;
  display: block;
  cursor: inherit;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.32));
  transition: left 0.18s ease;
}

.captcha-slider-dragging ~ .captcha-piece-canvas,
.captcha-piece-done {
  transition: none;
}

.captcha-success-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.42);
  color: var(--accent-green);
  font-size: 0.86rem;
  font-weight: 700;
}

.captcha-success-overlay svg {
  width: 36px;
  height: 36px;
  stroke-width: 2.4;
}

.captcha-slider-track {
  position: relative;
  height: 46px;
  margin: 14px 18px 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background-color: var(--bg-input);
  user-select: none;
}

.captcha-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background-color: rgba(var(--accent-blue-rgb), 0.16);
  transition: width 0.08s linear, background-color 0.2s;
}

.captcha-slider-error .captcha-fill {
  background-color: rgba(239, 68, 68, 0.14);
}

.captcha-slider-success .captcha-fill {
  background-color: rgba(16, 185, 129, 0.16);
}

.captcha-slider-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 46px;
  color: var(--text-muted);
  font-size: 0.8rem;
  pointer-events: none;
}

.captcha-slider-error .captcha-slider-hint {
  color: var(--accent-red);
}

.captcha-slider-success .captcha-slider-hint {
  color: var(--accent-green);
  font-weight: 700;
}

.captcha-btn {
  position: absolute;
  top: 3px;
  left: 0;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 38px;
  border: 1px solid rgba(var(--accent-blue-rgb), 0.45);
  border-radius: 7px;
  background-color: var(--bg-card);
  color: var(--accent-blue);
  cursor: grab;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  transition: left 0.18s ease, border-color 0.16s, color 0.16s, box-shadow 0.16s;
}

.captcha-btn:hover,
.captcha-btn-dragging {
  border-color: var(--accent-blue);
  color: var(--text-primary);
  box-shadow: 0 4px 16px rgba(var(--accent-blue-rgb), 0.22);
}

.captcha-btn-dragging {
  cursor: grabbing;
  transition: border-color 0.16s, color 0.16s, box-shadow 0.16s;
}

.captcha-btn-done {
  border-color: rgba(16, 185, 129, 0.55);
  color: var(--accent-green);
  cursor: default;
}

.captcha-modal-footer {
  padding: 10px 18px 16px;
  color: var(--text-muted);
  font-size: 0.73rem;
  line-height: 1.45;
  text-align: center;
}

.captcha-modal-enter-active,
.captcha-modal-leave-active {
  transition: opacity 0.2s ease;
}

.captcha-modal-enter-active .captcha-modal,
.captcha-modal-leave-active .captcha-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.captcha-modal-enter-from,
.captcha-modal-leave-to {
  opacity: 0;
}

.captcha-modal-enter-from .captcha-modal,
.captcha-modal-leave-to .captcha-modal {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.captcha-fade-enter-active,
.captcha-fade-leave-active {
  transition: opacity 0.2s;
}

.captcha-fade-enter-from,
.captcha-fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .captcha-overlay {
    align-items: flex-end;
    padding: 12px;
  }

  .captcha-modal {
    width: 100%;
  }

  .captcha-image-area {
    height: 154px;
  }
}
</style>
