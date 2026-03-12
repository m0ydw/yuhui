<template>
  <div class="root">
    <div class="title">认证失败</div>
    <div class="desc">身份验证未通过，请检查后重试。</div>
  </div>
</template>

<script setup lang="ts">
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
</style>