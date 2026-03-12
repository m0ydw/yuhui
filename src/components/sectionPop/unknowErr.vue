<template>
  <div class="root">
    <div class="title">异常状态</div>
    <div class="desc">操作发生异常，请刷新后重试。</div>

    <div class="actions">
      <button class="primary" @click="confirm">确认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 无 emit，直接刷新页面
function confirm() {
  location.reload()
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