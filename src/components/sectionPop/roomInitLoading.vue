<template>
  <div class="root">
    <div class="title">{{ message }}</div>
    <div class="sub">正在加载/合并房间初始化数据，请稍候…</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<style scoped>
.root {
  width: min(520px, 92vw);
  padding: 18px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 50px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}

.sub {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.55);
}
</style>

