<template>
  <Transition name="flexPop">
    <div v-if="state.visible" class="mask" @mousedown.self="close">
      <div class="son">
        <component :is="state.content" v-bind="state.props" @close="close" />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { reactive, markRaw } from 'vue'
let couldClose = true
const state = reactive({
  visible: false,
  content: null,
  props: {}
})

// 核心：暴露 open 方法
const open = (component, props = {}, canClose = true) => {
  state.content = markRaw(component)  // 标记为非响应式，优化性能
  state.props = props
  state.visible = true
  couldClose = canClose
  return {
    realExit: () => {
      state.visible = false
    }
  }
}

// 动态控制是否允许关闭（用于“初始化中”等不可打断场景）
const setCanClose = (next) => {
  couldClose = next
}

const close = () => {
  if (couldClose) {//能关闭则关闭否则无法关闭
    state.visible = false
  }
}

defineExpose({ open, close, setCanClose })
</script>

<style scoped>
.mask {
  width: 100vw;
  height: 100vh;
  position: absolute;
  z-index: 9999;
  left: 0;
  top: 0;
  background-color: rgba(0, 0, 0, 0.5);

}

.son {
  display: inline-block;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);

}
</style>