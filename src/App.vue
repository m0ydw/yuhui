<template>

  <router-view />
  <flexPop ref="popRef"></flexPop>
  <button @click="refresh"></button>
  <message></message>
</template>

<script setup lang="ts">
import { refresh } from './api/token';
import { onMounted, ref } from 'vue';
import flexPop from './components/flexPop.vue';
import message from './components/messageNotice/message.vue';
import { initPopFlex } from './models/flexpop/flexpop';
const popRef = ref()
onMounted(() => {
  initPopFlex(popRef.value)
})
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}

* {
  user-select: none;
}

/* 输入框/文本域 允许选中（不影响正常输入） */
input,
textarea {
  user-select: auto;
}
</style>
