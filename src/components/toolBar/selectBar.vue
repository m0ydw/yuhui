<template>
  <div class="selectBar" v-if="toolBarStore.isNeedDisplay()">
  </div>
</template>

<script setup lang="ts">
import toolBarData from '@/stores/toolBarStores';
let toolBarStore = toolBarData()

</script>

<style scoped>
.selectBar {
  position: absolute;
  width: 100px;
  height: 200px;
  background-color: aqua;
  left: 20px;
  top: 20px;
  border-radius: 10px;
  box-shadow: 0px 0px 6px 0px black;
}
</style>
