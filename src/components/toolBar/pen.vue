<template>
  <div class="pen" @click="toolData.setTool('pen')"></div>
</template>

<script setup lang="ts">
import toolBarData from '@/stores/toolBarStores';
let toolData = toolBarData()
</script>

<style>
.toolBar .pen {
  width: 50px;
  height: 50px;
  background-color: brown;
}
</style>
