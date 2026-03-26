<template>
  <div class="toolBar" :style="positionStyle" ref="main">
    <hand></hand>
    <pen></pen>
    <line-tool></line-tool>
    <rect-tool></rect-tool>
    <polyline-tool></polyline-tool>
    <ereaser></ereaser>
    <div class="move" ref="move" @pointerdown="moveDown" @pointerup="moveUp">
      <moveTool></moveTool>
    </div>
    <button class="undo-btn" @click="onUndo">撤销</button>
    <button class="redo-btn" @click="onRedo">撤回</button>
    <boardSection @select="Props.buttonFunction"></boardSection>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { toolBarPointer } from '@/models';
import boardSection from './boardSection.vue'
import hand from './toolBar/hand.vue'
import pen from './toolBar/pen.vue';
import lineTool from './toolBar/lineTool.vue'
import rectTool from './toolBar/rectTool.vue'
import polylineTool from './toolBar/polylineTool.vue'
import ereaser from './toolBar/ereaser.vue';
import useClientStore from '@/stores/clientStores';
import moveTool from './toolBar/moveTool.vue';
const position = ref({ x: 0, y: 0 })
const move = ref<HTMLDivElement | null>(null)
const main = ref<HTMLDivElement | null>(null)
const container = { w: 0, h: 0 }
//清理函数
let cleanup: (() => void) | null = null
// 延迟获取store实例，避免在Pinia挂载前使用
let clientStore: ReturnType<typeof useClientStore> | null = null
const positionStyle = computed(() => ({
  left: `${position.value.x}px`,  // 直接修改 left
  top: `${position.value.y}px`,   // 直接修改 top
}))
//改变父容器位置
const changePosition = (px: number, py: number) => {
  //限制不超出屏幕
  // 避让房间导航栏（roomUsersNav 收起/伸出都会更新该 CSS 变量）
  const navHeightRaw = getComputedStyle(document.documentElement).getPropertyValue('--room-users-nav-height')
  const navHeight = Number.parseFloat(navHeightRaw)
  const minTop = Number.isFinite(navHeight) ? navHeight + 6 : 0

  px = Math.max(Math.min(px, window.innerWidth - container.w), 0)
  py = Math.max(Math.min(py, window.innerHeight - container.h), minTop)
  position.value.x = px
  position.value.y = py
}



onMounted(() => {
  // 初始化store
  clientStore = useClientStore()
  if (move.value && main.value) {
    container.w = main.value.offsetWidth
    container.h = main.value.offsetHeight
    // 初始位置
    position.value.x = window.innerWidth * 0.5 - container.w * 0.5
    const navHeightRaw = getComputedStyle(document.documentElement).getPropertyValue('--room-users-nav-height')
    const navHeight = Number.parseFloat(navHeightRaw)
    const minTop = Number.isFinite(navHeight) ? navHeight + 6 : 0
    position.value.y = Math.max(window.innerHeight * 0.5 - container.h * 0.5, minTop)

    cleanup = toolBarPointer(move.value, changePosition, position)
  }

  // 监听导航栏高度变化：伸出时立即把 toolbar 顶到 nav 下方
  const onNavHeightChange = (e: any) => {
    const navHeight = Number(e?.detail)
    const minTop = Number.isFinite(navHeight) ? navHeight + 6 : 0
    if (position.value.y < minTop) position.value.y = Math.max(minTop, 0)
  }
  window.addEventListener('room-users-nav-height-change', onNavHeightChange)

  const oldCleanup = cleanup
  cleanup = () => {
    window.removeEventListener('room-users-nav-height-change', onNavHeightChange)
    oldCleanup?.()
  }
})

//结束
onUnmounted(() => {
  cleanup?.()
})

function onUndo() {
  clientStore?.getFlow()?.requestUndo()
}

function onRedo() {
  clientStore?.getFlow()?.requestRedo()
}
//props接收button函数
interface Prop {
  buttonFunction: (key: string) => void
}
const Props = defineProps<Prop>()

function moveDown() {
  if (move.value) {
    move.value.style.cursor = 'grabbing'
  }
}
function moveUp() {
  if (move.value) {
    move.value.style.cursor = 'grab'
  }
}
</script>

<style>
.toolBar {
  position: absolute;
  padding: 5px;
  border: 1px solid silver;
  margin: 3px;
  z-index: 10;
  border-radius: 10px;
}

.toolBar {
  display: flex;
  /* 开启 flex 布局 */
  justify-content: center;
  /* 水平居中 */
  align-items: center;
  /* 垂直居中 */
  gap: 5px;
  /* 元素间距，可根据需要调整 */
  height: 60px;
  /* toolbar 高度，可按需修改 */
  background-color: #f5f5f5;
  /* 可选背景 */
  padding: 0 20px;
  /* 左右内边距 */
}


.toolBar div {
  float: left;
  margin-left: 5px;
}

.toolBar>div:first-child {
  margin-left: 0px;
}

.undo-btn,
.redo-btn {
  width: 53.33px;
  height: 33.33px;
  margin-left: 8px;
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background-color: #ffffff;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.undo-btn:hover,
.redo-btn:hover {
  background-color: #f0f7ff;
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.move {
  cursor: grab;
}
</style>
