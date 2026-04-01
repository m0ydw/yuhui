<template>
  <div class="app-wrapper">
    <router-view />
    <flexPop ref="popRef"></flexPop>
    <!-- <button @click="test"></button> -->
    <message></message>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, provide, nextTick } from 'vue';
import flexPop from './components/flexPop.vue';
import message from './components/messageNotice/message.vue';
import { initPopFlex } from './models/flexpop/flexpop';
import { request } from './api';
const popRef = ref()
onMounted(() => {
  initPopFlex(popRef.value)
})
// const test = async () => {
//   console.log(2)
//   const res = await request('api/roomAdd', 'POST', {}, false)

// }
//刷新机制
const isReload = ref(true)
const reload = () => {
  isReload.value = false
  nextTick(() => {
    isReload.value = true
  })
}
//注入刷新方法
provide('reload', reload)
</script>

<style>
html,
body,
html,
body {
  min-width: 920px !important;
  margin: 0;
  padding: 0;
  /* 允许横向滚动，不挤压布局 */
}

#app {
  margin: 0;
  padding: 0;
  height: 100%;
}

* {
  user-select: none;
  box-sizing: border-box;
}

input,
textarea {
  user-select: auto;
}

.app-wrapper {
  min-width: 800px !important;
  width: 100%;
  height: 100%;
}
</style>
