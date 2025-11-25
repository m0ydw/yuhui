<template>
  <div class="hand" @pointerdown="toolData.setTool('hand')"></div>
</template>

<script setup lang="ts">
import toolBarData from '@/stores/toolBarStores';
let toolData = toolBarData()
</script>

<style>
.toolBar .hand {
  background-color: blue;
  width: 50px;
  height: 50px;
}
</style>
