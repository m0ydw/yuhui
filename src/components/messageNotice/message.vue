<template>
  <div>
    <messageContainer :type="'baseNotice'" ref="baseMessage"></messageContainer>
    <messageContainer :type="'userNotice'" ref="userMessage"></messageContainer>
  </div>
</template>

<script setup lang="ts">
import messageContainer from './messageContainer.vue';
import { ref, onMounted, nextTick } from 'vue';
import { initBase, initUser } from '@/models/message/message';
const baseMessage = ref()
const userMessage = ref()

onMounted(() => {
  initBase(baseMessage.value)
  initUser(userMessage.value)
})
</script>

<style scoped></style>
