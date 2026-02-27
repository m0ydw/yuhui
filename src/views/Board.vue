<template>
  <div>
    <toolBar></toolBar>
    <selectBar></selectBar>
    <mainBoard></mainBoard>
    <button class="chat-toggle" v-if="roomId" @click="toggleChat">
      聊天
    </button>
    <room-chat v-if="roomId" v-model="chatVisible" :room-id="roomId" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import mainBoard from '../components/mainBoard.vue'
import toolBar from '../components/toolBar.vue';
import selectBar from '@/components/toolBar/selectBar.vue';
import roomChat from '@/components/chat/roomChat.vue'

const route = useRoute()
const chatVisible = ref(false)
const roomId = computed(() => {
  const id = route.query.roomId
  return typeof id === 'string' ? id : ''
})

function toggleChat() {
  chatVisible.value = !chatVisible.value
}
</script>

<style scoped>
.chat-toggle {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 40;
  width: 64px;
  height: 36px;
  border-radius: 18px;
  border: none;
  background: #409eff;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}
</style>

