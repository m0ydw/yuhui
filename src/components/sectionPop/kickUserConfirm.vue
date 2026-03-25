<template>
  <div class="root">
    <div class="title">确认移除</div>
    <div class="sub">
      是否移除 <b>{{ targetName }}</b>？
    </div>

    <textarea
      v-model="message"
      class="textarea"
      placeholder="留言内容（可选）"
      maxlength="200"
    />

    <div class="actions">
      <button class="ghost" @click="emit('close')">取消</button>
      <button class="danger" :disabled="busy" @click="confirm">
        确认移除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { myWebsocketClient } from '@/models/webSocket/cilentExample'

const props = defineProps<{
  roomId: string
  targetUserId: string
  targetName: string
}>()

const emit = defineEmits<{ close: [] }>()

const message = ref('')
const busy = ref(false)

function confirm() {
  if (busy.value) return
  busy.value = true
  myWebsocketClient.send(
    JSON.stringify({
      type: 'kickUser',
      data: {
        roomId: props.roomId,
        targetUserId: props.targetUserId,
        message: message.value || '',
      },
    }),
  )
  // 发送后直接关闭弹窗
  emit('close')
}
</script>

<style scoped>
.root {
  width: min(520px, 86vw);
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}

.title {
  font-size: 16px;
  font-weight: 800;
  color: #111827;
}

.sub {
  margin-top: 10px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.textarea {
  margin-top: 12px;
  width: 100%;
  height: 90px;
  resize: none;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  outline: none;
}

.actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ghost {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
}

.danger {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  background: #f56c6c;
  color: #fff;
  cursor: pointer;
  font-weight: 700;
}

.danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

