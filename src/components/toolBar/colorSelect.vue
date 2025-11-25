<template>
  <div class="wrapper" :style="{ width: panelWidth + 2 + 'px' }">
    <!-- 2. 二维 Saturation / Lightness 面板 -->
    <div class="panel" ref="panel">
      <canvas :width="panelWidth" :height="panelHeight" ref="canvas"></canvas>
      <!-- 点 -->
      <div class="dot" :style="{ left: dot.x + 'px', top: dot.y + 'px' }"></div>
    </div>
    <!-- 1. 主色调 Hue 滑条 -->
    <div class="hue-track" ref="hueTrack">
      <div class="hue-thumb" :style="{ left: hueThumb + 'px' }"></div>
    </div>
    <!-- 3. 透明度拖动条 -->
    <div class="alpha-track" ref="alphaTrack">
      <!-- 背景图 -->
      <div class="backImg" :style="{ backgroundImage: `url(${checkerboard})` }"></div>
      <!-- 渐变 -->
      <div class="alpha-gradient" :style="{ background: alphaGradient }"></div>
      <!-- 滑块 -->
      <div class="alpha-thumb" :style="{ left: alphaThumb + 'px' }"></div>
    </div>

    <!-- 4. 结果 -->
    <div class="swatch">
      <!-- 背景 -->
      <div class="backImg" :style="{ backgroundImage: `url(${checkerboard})` }"></div>
      <!-- 结果 -->
      <div class="color" :style="{ background: rgbaStr }"></div>
    </div>
    <div class="hex">{{ rrggbbaa }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'

/* ---------- props ---------- */
const props = withDefaults(defineProps<{
  panelWidth?: number
  panelHeight?: number
}>(), {
  panelWidth: 180,
  panelHeight: 120,
})

/* ---------- 状态 ---------- */
const canvas = ref<HTMLCanvasElement>()
const panel = ref<HTMLElement>()
const hueTrack = ref<HTMLElement>()
const alphaTrack = ref<HTMLElement>()
//背景图
const checkerboard = `
data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==
`
const hue = ref(0)                     // 主色调 0-360
const dot = reactive({ x: props.panelWidth / 2, y: props.panelHeight / 2 }) // 面板采样点
const alpha = ref(255)                   // 透明度 0-255

const rgba = ref<[number, number, number, number]>([255, 0, 0, 255])

/* ---------- 计算 ---------- */
const toHex = (n: number) => n.toString(16).padStart(2, '0')
const rrggbbaa = computed(() => {
  const [r, g, b] = rgba.value
  return `${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alpha.value)}`
})
const rgbaStr = computed(() => {
  const [r, g, b] = rgba.value
  return `rgba(${r},${g},${b},${alpha.value / 255})`
})
//透明条背景
/* 透明度轨道背景 = 主色调 → 透明 */
const alphaGradient = computed(
  () =>
    `linear-gradient(to right, hsl(${hue.value}, 100%, 50%, 0) 0%, hsl(${hue.value}, 100%, 50%, 1) 100%)`
)
/* ---------- 画面板：Saturation × Lightness ---------- */
function drawPanel() {
  const ctx = canvas.value!.getContext('2d')!
  const w = props.panelWidth
  const h = props.panelHeight
  // 横向 Saturation 0→100%，纵向 Lightness 100→0（越上越白）
  for (let y = 0; y < h; y++) {
    const grad = ctx.createLinearGradient(0, y, w, y)
    const light = 100 - (y / h) * 100
    grad.addColorStop(0, `hsl(${hue.value}, 0%, ${light}%)`)
    grad.addColorStop(1, `hsl(${hue.value}, 100%, ${light}%)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, y, w, 1)
  }
}

/* ---------- 采样颜色（依据 dot 坐标 + 当前 hue + alpha） ---------- */
function sampleColor() {
  const ctx = canvas.value!.getContext('2d')!
  const img = ctx.getImageData(dot.x, dot.y, 1, 1).data
  if (img[0] && img[1] && img[2])

    rgba.value = [img[0], img[1], img[2], alpha.value]
}

/* ---------- 通用拖动钩子 ---------- */
function useDrag(
  area: HTMLElement,
  onMove: (x: number, y: number) => void,
  clamp?: (x: number, y: number) => { x: number; y: number }
) {
  let dragging = false
  const down = (e: MouseEvent) => {
    dragging = true
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    move(e)
  }
  const move = (e: MouseEvent) => {
    if (!dragging) return
    const rect = area.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    if (clamp) ({ x, y } = clamp(x, y))
    onMove(x, y)
  }
  const up = () => {
    dragging = false
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  area.addEventListener('mousedown', down)
}

/* ---------- 1. Hue 滑条 ---------- */
const hueThumb = ref(0)
onMounted(() => {
  useDrag(
    hueTrack.value!,
    (x) => {
      const w = hueTrack.value!.clientWidth
      x = Math.max(0, Math.min(w, x))
      hueThumb.value = x
      hue.value = Math.round((x / w) * 360)
      drawPanel()
      sampleColor()
    }
  )
  // 初始 hue 放中间
  hue.value = 180
  hueThumb.value = hueTrack.value!.clientWidth / 2
})

/* ---------- 2. 面板拖动 ---------- */
onMounted(() => {
  useDrag(
    panel.value!,
    (x, y) => {
      dot.x = Math.max(0, Math.min(props.panelWidth - 1, x))
      dot.y = Math.max(0, Math.min(props.panelHeight - 1, y))
      sampleColor()
    }
  )
})

/* ---------- 3. 透明度拖动 ---------- */
const alphaThumb = ref(0)
onMounted(() => {
  const trackW = props.panelWidth
  alphaThumb.value = trackW / 2
  useDrag(
    alphaTrack.value!,
    (x) => {
      x = Math.max(0, Math.min(trackW, x))
      alphaThumb.value = x
      alpha.value = Math.round((x / trackW) * 255)
      sampleColor()
    }
  )
})

/* ---------- hue 变化重绘面板 ---------- */
watch(hue, () => {
  drawPanel()
  sampleColor()
})

/* ---------- 初次 ---------- */
onMounted(() => {
  drawPanel()
  sampleColor()
})
</script>

<style scoped>
.wrapper {
  display: inline-block;
  user-select: none;
  font-family: sans-serif;
}

/* Hue 轨道 */
.hue-track {
  position: relative;
  width: 100%;
  height: 16px;
  background: linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%));
  border: 1px solid #ccc;
  border-radius: 3px;
  margin-bottom: 8px;
  cursor: pointer;
}

/* 俩个滑块 */
.alpha-thumb,
.hue-thumb {
  position: absolute;
  top: -2px;
  width: 6px;
  height: 20px;
  background: white;
  border: 1px solid #0066ff;
  border-radius: 2px;
  transform: translate(-50%, 0);
}

/* 面板 */
.panel {
  position: relative;
  border: 1px solid #ccc;
  cursor: crosshair;
}

canvas {
  display: block;
}

/* 点 */
.dot {
  z-index: 100;
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 2px solid #0066ff;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* Alpha 轨道 */
.alpha-track {
  position: relative;
  width: 100%;
  height: 16px;
  border: 1px solid #ccc;
  margin: 8px 0;
  cursor: pointer;
}

.color,
.alpha-gradient,
.backImg {
  position: absolute;
  inset: 0;
  background-size: 8px 8px;
  background-repeat: repeat;
  width: 100%;
  height: 100%;
}

.swatch {
  position: relative;
  width: 60px;
  height: 30px;
  border: 1px solid #aaa;
}

.hex {
  margin-top: 6px;
  font-family: monospace;
}
</style>