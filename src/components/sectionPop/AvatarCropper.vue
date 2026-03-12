<template>
  <div class="cropper-modal">
    <div class="cropper-box">
      <canvas ref="canvas" @pointerdown="startDrag" @pointermove="dragging" @pointerup="endDrag"
        @wheel.prevent="zoomImage"></canvas>
      <div class="btns">
        <button @click="close">取消</button>
        <button @click="confirm">确认裁剪</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{ visible?: boolean, file: File | null }>()
const emit = defineEmits<{ close: [], success: [blob: Blob] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let img: HTMLImageElement | null = null

// 拖拽和缩放
let imgX = 0
let imgY = 0
let imgW = 0
let imgH = 0
let draggingFlag = false
let dragStartX = 0
let dragStartY = 0
let startImgX = 0
let startImgY = 0
let scale = 1
const minScale = 0.5
const maxScale = 3

const cropSize = 180
const canvasDisplaySize = 400 // 显示大小
const dpr = window.devicePixelRatio || 1 // 高分屏支持
const canvasSize = canvasDisplaySize * dpr

watch(
  () => props.file,
  async (file) => {
    if (file) {
      await nextTick()
      start()
    }
  },
  { immediate: true }
)

function start() {
  if (!canvas.value || !props.file) return
  img = new Image()
  img.onload = () => {
    const c = canvas.value!
    ctx = c.getContext('2d')
    if (!ctx) return

    // 高分辨率 canvas 设置
    c.width = canvasSize
    c.height = canvasSize
    c.style.width = canvasDisplaySize + 'px'
    c.style.height = canvasDisplaySize + 'px'

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 初始缩放
    const ratio = Math.max(cropSize / img!.width, cropSize / img!.height)
    scale = ratio * 2
    imgW = img!.width * scale
    imgH = img!.height * scale
    imgX = (canvasDisplaySize - imgW) / 2
    imgY = (canvasDisplaySize - imgH) / 2

    draw()
  }
  img.onerror = () => console.error('Image load error')
  img.src = URL.createObjectURL(props.file)
}

function draw() {
  if (!ctx || !canvas.value || !img) return
  const c = canvas.value
  ctx.clearRect(0, 0, c.width, c.height)

  const cx = (canvasDisplaySize - cropSize) / 2
  const cy = (canvasDisplaySize - cropSize) / 2

  // 绘制图片
  ctx.drawImage(img, imgX, imgY, imgW, imgH)

  // 遮罩
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(0, 0, canvasDisplaySize, cy) // 上
  ctx.fillRect(0, cy + cropSize, canvasDisplaySize, canvasDisplaySize - cy - cropSize) // 下
  ctx.fillRect(0, cy, cx, cropSize) // 左
  ctx.fillRect(cx + cropSize, cy, canvasDisplaySize - cx - cropSize, cropSize) // 右

  // 裁剪框
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(cx, cy, cropSize, cropSize)
}

function startDrag(e: PointerEvent) {
  if (!canvas.value) return
  draggingFlag = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  startImgX = imgX
  startImgY = imgY
  canvas.value.setPointerCapture(e.pointerId)
}

function dragging(e: PointerEvent) {
  if (!draggingFlag) return

  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY

  let newX = startImgX + dx
  let newY = startImgY + dy

  const cx = (canvasDisplaySize - cropSize) / 2
  const cy = (canvasDisplaySize - cropSize) / 2

  // 限制边界，裁剪框始终覆盖图片
  const maxX = cx
  const minX = cx + cropSize - imgW
  const maxY = cy
  const minY = cy + cropSize - imgH

  if (imgW < cropSize) newX = cx + (cropSize - imgW) / 2
  else if (newX > maxX) newX = maxX
  else if (newX < minX) newX = minX

  if (imgH < cropSize) newY = cy + (cropSize - imgH) / 2
  else if (newY > maxY) newY = maxY
  else if (newY < minY) newY = minY

  imgX = newX
  imgY = newY

  draw()
}

function endDrag(e: PointerEvent) {
  draggingFlag = false
  if (canvas.value) canvas.value.releasePointerCapture(e.pointerId)
}

function zoomImage(e: WheelEvent) {
  if (!img || !canvas.value) return
  const cx = (canvasDisplaySize - cropSize) / 2
  const cy = (canvasDisplaySize - cropSize) / 2

  let delta = e.deltaY < 0 ? 1.05 : 0.95
  let newScale = scale * delta

  // 计算缩放后图片大小
  const newW = img.width * newScale
  const newH = img.height * newScale

  // 校验缩放，保证裁剪框不超出图片边界
  if (newW < cropSize) newScale = cropSize / img.width
  if (newH < cropSize) newScale = cropSize / img.height


  // 缩放中心在裁剪框中心
  const oldW = imgW
  const oldH = imgH

  scale = newScale
  imgW = img.width * scale
  imgH = img.height * scale

  imgX = cx - ((cx - imgX) * imgW) / oldW
  imgY = cy - ((cy - imgY) * imgH) / oldH

  // 边界修正
  const maxX = cx
  const minX = cx + cropSize - imgW
  const maxY = cy
  const minY = cy + cropSize - imgH
  if (imgX > maxX) imgX = maxX
  if (imgX < minX) imgX = minX
  if (imgY > maxY) imgY = maxY
  if (imgY < minY) imgY = minY

  draw()
}

function close() {
  emit('close')
}

function confirm() {
  if (!canvas.value || !ctx || !img) return
  const croppedCanvas = document.createElement('canvas')

  // 放大到 600x600，不模糊
  croppedCanvas.width = 600
  croppedCanvas.height = 600

  const croppedCtx = croppedCanvas.getContext('2d')
  if (!croppedCtx) return

  const cx = (canvasDisplaySize - cropSize) / 2
  const cy = (canvasDisplaySize - cropSize) / 2

  croppedCtx.drawImage(
    img,
    (cx - imgX) / imgW * img.width,
    (cy - imgY) / imgH * img.height,
    cropSize / imgW * img.width,
    cropSize / imgH * img.height,
    0,
    0,
    600,  // 输出高清尺寸
    600
  )

  // 高质量 300-500KB，
  croppedCanvas.toBlob((blob) => {
    if (blob) emit('success', blob)
  }, 'image/jpeg', 0.9) // 质量 0.9
}
</script>

<style scoped>
.cropper-modal {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cropper-box {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

canvas {
  border: 1px solid #ccc;
  cursor: grab;
  width: 500px;
  height: 500px;
}

canvas:active {
  cursor: grabbing;
}

.btns {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

button:first-child {
  background: #f5f5f5;
  color: #333;
}

button:last-child {
  background: #409eff;
  color: #fff;
}
</style>