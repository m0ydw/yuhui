<template>
  <div class="scale">
    <button class="scaleItem left" @click="add()">
      <span class="icon icon-plus"></span>
    </button>
    <span class="scaleItem reset no-select" @click="reSet">{{ aim }}</span>
    <button class="scaleItem right" @click="del()">
      <span class="icon icon-minus"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { type Board } from '@/models';
import { ref, watch, onMounted, onUnmounted } from 'vue';
interface Props {
  board: Board,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
}
const props = defineProps<Props>()

const aim = ref(100 * Number(props.board.getZoom()))

const setAim = (newNumber: number, panx?: number, pany?: number) => {
  if (panx && pany) {//传中心则使用
    aim.value = newNumber
    props.board.setZoom(aim.value / 100, props.ctx, props.canvas, panx, pany)
  }
  else {
    aim.value = newNumber
    props.board.setZoom(aim.value / 100, props.ctx, props.canvas)
  }

}
const add = (panx?: number, pany?: number) => {
  let willchange = 0;
  if (aim.value < 10) {
    willchange = aim.value + 1
  }
  else if (aim.value < 100) {
    willchange = aim.value + 10
  }
  else if (aim.value >= 100) {
    willchange = aim.value + 100
  }
  willchange = Math.min(3000, Math.max(0, willchange))
  if (panx && pany) {//传中心则使用
    setAim(willchange, panx, pany)
  }
  else {
    setAim(willchange)
  }

}
const del = (panx?: number, pany?: number) => {
  let willchange = 0;
  if (aim.value <= 10) {
    willchange = aim.value - 1
  }
  else if (aim.value <= 100) {
    willchange = aim.value - 10
  }
  else if (aim.value <= 3000) {
    willchange = aim.value - 100
  }
  willchange = Math.min(3000, Math.max(1, willchange))
  if (panx && pany) {//传中心则使用
    setAim(willchange, panx, pany)
  }
  else {
    setAim(willchange)
  }
}
const reSet = () => {
  setAim(100)
}
//快捷键缩放控制
function onWheel(e: WheelEvent) {
  if (!e.ctrlKey) return          // 1. 没按 Ctrl 就不管

  e.preventDefault()              // 2. 屏蔽浏览器缩放
  const dir = Math.sign(e.deltaY) // 3. 方向 -1 上滚，1 下滚
  dir < 0 ? add(e.offsetX, e.offsetY) : del(e.offsetX, e.offsetY)         // 4. 上滚放大，下滚缩小
}
//挂载
onMounted(() => {
  window.addEventListener('wheel', onWheel, { passive: false }) // 必须 passive:false 才能 preventDefault
})
//取消
onUnmounted(() => {
  window.removeEventListener('wheel', onWheel)
})
</script>

<style scoped>
/* 1. 所有默认样式清零 */
button {
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  font: inherit;
  /* 继承父级字号、字族 */
  color: inherit;
  background: transparent;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  box-shadow: none;
  border-radius: 0;
  text-align: inherit;
  vertical-align: inherit;
  line-height: inherit;
}

button:focus {
  outline: none;
}

button {
  -webkit-tap-highlight-color: transparent;
}

.scale {
  display: flex;
  position: absolute;
  width: 87px;
  height: 27px;
  left: 30px;
  bottom: 30px;
  background-color: #d3f1f1f2;
  border-radius: 5px;
  text-align: center;
}

.scaleItem {
  flex: 1;
}

.scale button {
  line-height: 27px;
}

.left {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  overflow: hidden;
}

.right {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  overflow: hidden;
}

.scale button:hover {
  background-color: #afd3d3f2;
}

/* 共同基础 */
.icon {
  width: 8px;
  /* 只看线，不管整体大小 */
  height: 1px;
  /* 横线厚度 */
  background: rgb(41, 41, 41);
  /* 横线颜色 */
  position: relative;
  transform: translate(1px, -2px);
  display: inline-block;
  vertical-align: middle;
}

/* 加号再画一根竖线 */
.icon-plus::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1px;
  height: 8px;
  /* 竖线长度 */
  background: rgb(41, 41, 41);
  transform: translate(-50%, -50%);
}

.reset {
  cursor: pointer;
}

.reset::before {
  content: "重置";
  position: absolute;
  font-size: 12px;
  transform: translate(-10%, -100%);
  width: 29px;
  z-index: 1000;
  color: white;
  background-color: black;
  padding: 2px 4px;
  border-radius: 5px;
  opacity: 0;
}

.reset:hover::before {
  opacity: 1;
}

.no-select {
  user-select: none;
}
</style>
