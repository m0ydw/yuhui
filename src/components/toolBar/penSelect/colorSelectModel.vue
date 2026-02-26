<template>
  <div class="color-select">
    <!-- 饱和-明度面板 -->
    <div class="saturation-value" ref="svEl" @mousedown="mdSV">
      <div :style="`background-color: hsl(${hue},100%,50%)`">
        <div class="point" :style="pointStyle"></div>
      </div>
      <div class="saturation-value-2"></div>
      <div class="saturation-value-3"></div>
    </div>

    <!-- 色相滑块 -->
    <div class="hue-slider" ref="hueEl" @mousedown="mdHue">
      <div class="slider" :style="hueSliderStyle"></div>
    </div>

    <!-- 透明度滑条 -->
    <div class="alpha-slider" ref="alphaEl" @mousedown="mdAlpha">
      <div class="backImg" :style="{ backgroundImage: `url(${checkerboard})` }"></div>
      <div class="alpha-gradient" :style="{ background: alphaGradient }"></div>
      <div class="alpha-thumb" :style="{ left: alphaThumb + 'px' }"></div>
    </div>

    <!-- 预览 + 6 位 Hex -->
    <div class="bottom">
      <div class="preview">
        <div class="backImg" :style="{ backgroundImage: `url(${checkerboard})` }"></div>
        <div class="color-overlay" :style="{ background: rgbaStr }"></div>
      </div>
      <div class="hex">
        <input :value="hex8" @input="onHex" spellcheck="false" maxlength="9">
        <span>Hex</span>
      </div>
    </div>

    <!-- 预设色 -->
    <ul class="preset">
      <li v-for="c in preset" :key="c" :style="{ background: c }" @click="applyHex(c)"></li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '#409eff' },
  preset: {
    type: Array,
    default: () => [
      '#d0021b', '#f5a623', '#f8e71c', '#8b572a', '#7ed321',
      '#417505', '#bd10e0', '#9013fe', '#4a90e2', '#50e3c2',
      '#b8e986', '#000000', '#4a4a4a', '#9b9b9b', '#ffffff'
    ]
  }
});
const emit = defineEmits(['update:modelValue']);

/* ---------- 数据 ---------- */
const hue = ref(0);
const saturation = ref(1);
const value = ref(1);
const alpha = ref(1); // 透明度

const svEl = ref(null);
const hueEl = ref(null);
const alphaEl = ref(null);

/* ---------- 颜色计算 ---------- */
function hsv2rgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else[r, g, b] = [c, 0, x];
  return [r + m, g + m, b + m].map(e => Math.round(e * 255));
}
function rgb2hex([r, g, b]) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

const rgb = computed(() => hsv2rgb(hue.value, saturation.value, value.value));
const rgbStr = computed(() => `rgb(${rgb.value.join(',')})`);
const rgbaStr = computed(() => `rgba(${rgb.value.join(',')},${alpha.value})`);
const hex6 = computed(() => rgb2hex(rgb.value));
const hex8 = computed(() => `${hex6.value}${Math.round(alpha.value * 255).toString(16).padStart(2, '0')}`);

watch(hex8, v => emit('update:modelValue', v));

/* ---------- 解析外部 hex ---------- */
function fromHex(str = '') {
  let s = str.startsWith('#') ? str.slice(1) : str;
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(s)) return;
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(s.substr(i, 2), 16));
  const a = s.length === 8 ? parseInt(s.substr(6, 2), 16) / 255 : 1;
  const { h, s: hs, v: vs } = rgb2hsv(r, g, b);
  hue.value = h;
  saturation.value = hs;
  value.value = vs;
  alpha.value = a;
}
onMounted(() => fromHex(props.modelValue));

/* ---------- HSV ↔ RGB 互转 ---------- */
function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

/* ---------- 透明度滑条逻辑 ---------- */
const checkerboard = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==`;
const alphaThumb = computed(() => {
  if (!alphaEl.value) return 0;
  const { width } = alphaEl.value.getBoundingClientRect();
  return alpha.value * width; // 滑块位置 = alpha 值 * 滑条宽度
});
const alphaGradient = computed(() => `linear-gradient(to right, rgba(${rgb.value.join(',')},0), rgba(${rgb.value.join(',')},1))`);

function mdAlpha(e) {
  drag(e, alphaEl, ({ x }) => {
    const { width } = alphaEl.value.getBoundingClientRect();
    alpha.value = Math.min(1, Math.max(0, x / width)); // 根据滑动位置更新 alpha 值
  });
}

/* ---------- 交互 ---------- */
const pointStyle = computed(() => ({
  left: `${saturation.value * 100}%`,
  top: `${(1 - value.value) * 100}%`
}));
const hueSliderStyle = computed(() => ({
  left: `${(hue.value / 360) * 100}%`
}));

function mdSV(e) {
  drag(e, svEl, ({ x, y }) => {
    const { width, height } = svEl.value.getBoundingClientRect();
    saturation.value = Math.min(1, Math.max(0, x / width));
    value.value = Math.min(1, Math.max(0, 1 - y / height));
  });
}
function mdHue(e) {
  drag(e, hueEl, ({ x }) => {
    const { width } = hueEl.value.getBoundingClientRect();
    hue.value = (x / width) * 360;
  });
}
function drag(startE, el, cb) {
  startE.preventDefault();
  const rect = el.value.getBoundingClientRect();
  function move(e) {
    const x = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
    const y = Math.min(rect.height, Math.max(0, e.clientY - rect.top));
    cb({ x, y });
  }
  move(startE);
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

/* ---------- hex 输入 ---------- */
function onHex(e) {
  let v = e.target.value.trim();
  if (!/^#?[0-9a-fA-F]{0,8}$/.test(v)) return;
  fromHex(v || '#000000ff');
}
function applyHex(c) {
  fromHex(c);
}
</script>

<style scoped>
.color-select {
  user-select: none;
  width: 220px;
  background: #fff;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.saturation-value {
  position: relative;
  width: 100%;
  height: 160px;
  cursor: pointer;
  background: #ccc;
}

.saturation-value>div {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.saturation-value-2 {
  background: linear-gradient(to right, #fff, transparent);
}

.saturation-value-3 {
  background: linear-gradient(to top, #000, transparent);
}

.point {
  position: absolute;
  width: 8px;
  height: 8px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 2px #000;
  transform: translate(-50%, -50%);
}

.hue-slider {
  position: relative;
  height: 12px;
  margin-top: 8px;
  background: linear-gradient(90deg, red 0, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, red);
  cursor: pointer;
}

.slider {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background: #fff;
  box-shadow: 0 0 2px #000;
  transform: translateX(-2px);
}

.alpha-slider {
  position: relative;
  height: 12px;
  margin-top: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
}

.alpha-slider .backImg {
  position: absolute;
  inset: 0;
  background-size: 8px 8px;
  background-repeat: repeat;
}

.preview .backImg {
  position: absolute;
  inset: 0;
  background-size: 9px 9px;
  background-repeat: repeat;
  z-index: 1;
  /* 背景图层级较低 */
}

.preview .color-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  /* 颜色层级较高 */
}

.alpha-slider .alpha-gradient {
  position: absolute;
  inset: 0;
}

.alpha-slider .alpha-thumb {
  position: absolute;
  top: -2px;
  width: 6px;
  height: 16px;
  background: #fff;
  border: 1px solid #0066ff;
  border-radius: 2px;
  transform: translateX(-50%);
}

.bottom {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.preview {
  position: relative;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-right: 8px;
  z-index: 10;
  overflow: hidden;
  /* 确保内容不会超出边界 */
}

.hex {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.hex input {
  width: 100px;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 12px;
  text-transform: uppercase;
}

.hex span {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.preset {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  padding: 0;
  list-style: none;
}

.preset li {
  width: 18px;
  height: 18px;
  margin: 2px;
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
}
</style>