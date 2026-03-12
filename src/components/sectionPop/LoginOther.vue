<template>
  <div class="root">
    <div class="title">登录状态异常</div>
    <div class="desc">你的账号已在其他设备或位置登录，如需继续操作请重新登录。</div>

    <div class="actions">
      <button class="primary" @click="confirm">确定</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

function confirm() {
  emit('close')
  location.reload();
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

desc {
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

.primary {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  background: #409eff;
  color: #fff;
  cursor: pointer;
}
</style>