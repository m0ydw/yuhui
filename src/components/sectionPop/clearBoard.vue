<template>
  <div class="root">
    <div class="title">清空画布</div>
    <div class="desc" v-if="online">联机模式下已禁用清空画布（避免与多人同步状态冲突）。</div>
    <div class="desc" v-else>清空后将移除当前画布的所有内容。确定要清空吗？</div>

    <div class="actions">
      <button class="ghost" @click="emit('close')">取消</button>
      <button class="danger" :disabled="online" @click="confirm">清空</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Board, strokeFlow } from '@/models'

const props = defineProps<{
  boardData: Board
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  userQueue: strokeFlow
  online?: boolean
}>()
const emit = defineEmits<{ close: [] }>()

const online = Boolean(props.online)

function confirm() {
  if (online) return
  props.userQueue.clearAll()
  props.boardData.clearAll(props.ctx, props.canvas)
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
  font-weight: 700;
}

.desc {
  margin-top: 10px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.actions {
  margin-top: 16px;
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
}

.danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

