<template>
  <div class="toolBar" :style="positionStyle" ref="main">
    <hand></hand>
    <pen></pen>
    <line-tool></line-tool>
    <rect-tool></rect-tool>
    <polyline-tool></polyline-tool>
    <ereaser></ereaser>
    <div class="move" ref="move">
      <moveTool></moveTool>
    </div>
    <button class="undo-btn" @click="onUndo">撤销</button>
    <button class="redo-btn" @click="onRedo">撤回</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { toolBarPointer } from '@/models';
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
  px = Math.max(Math.min(px, window.innerWidth - container.w), 0)
  py = Math.max(Math.min(py, window.innerHeight - container.h), 0)
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
    cleanup = toolBarPointer(move.value, changePosition, position)
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
</script>

<style>
.toolBar {
  position: absolute;
  padding: 5px;
  border: 1px solid silver;
  margin: 3px;
  z-index: 10;
}


.toolBar div {
  float: left;
  margin-left: 5px;
}

.toolBar>div:first-child {
  margin-left: 0px;
}

.undo-btn {
  margin-left: 8px;
  padding: 6px 10px;
  border: 1px solid #999;
  background: #fff;
  cursor: pointer;
}

.undo-btn:hover,
.redo-btn:hover {
  background: #f5f5f5;
}

.redo-btn {
  margin-left: 4px;
  padding: 6px 10px;
  border: 1px solid #999;
  background: #fff;
  cursor: pointer;
}
</style>
