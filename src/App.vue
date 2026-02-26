<template>
  <router-view />
  <message></message>
  <button @click="refresh"></button>
</template>

<script setup lang="ts">
import message from './components/messageNotice/message.vue';
import { refresh } from './api/token';
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
