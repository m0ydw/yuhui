<template>
  <div class="root">
    <div class="title">无法加入</div>
    <div class="desc">{{ message }}</div>

    <div class="actions">
      <button class="primary" @click="handleConfirm">确认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const props = defineProps<{
  message: string
  code: number
}>()

function handleConfirm() {
  console.log(props.code)
  if (props.code === 1008)
    router.push({ name: 'Login' })
  else
    router.push({ name: 'allRoom' })

  emit('close')
}
</script>

<style scoped>
.root {
  width: min(520px, 86vw);
  background: #fff;
  border-radius: 18px;
  padding: 22px 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.25s ease;
}

.title {
  font-size: 17px;
  font-weight: 700;
  color: #222;
}

.desc {
  margin-top: 10px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary {
  height: 36px;
  padding: 0 18px;
  border-radius: 12px;
  border: none;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary:hover {
  background: #338eef;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(64, 158, 255, 0.25);
}

.primary:active {
  transform: translateY(0);
}
</style>