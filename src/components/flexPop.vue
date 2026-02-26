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

const state = reactive({
  visible: false,
  content: null,
  props: {}
})

// 核心：暴露 open 方法
const open = (component, props = {}) => {
  state.content = markRaw(component)  // 标记为非响应式，优化性能
  state.props = props
  state.visible = true
}

const close = () => {
  state.visible = false
}

defineExpose({ open, close })
</script>