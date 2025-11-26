<template>
  <div class="selectBar" ref="box" v-if="toolBarStore.isNeedDisplay()">
    <colorSelect></colorSelect>
  </div>
</template>

<script setup lang="ts">
import toolBarData from '@/stores/toolBarStores';
import colorSelect from './penSelect/colorSelect.vue';
let toolBarStore = toolBarData()
import { ref, onMounted, onBeforeUnmount } from 'vue';
const box = ref<HTMLElement | null>(null);
function onClick(e: MouseEvent) {
  if (box.value && !box.value.contains(e.target as Node) && toolBarStore.isNeedDisplay()) {
    //修改为不可见
    toolBarStore.changeSelectBar(false)
  }
}
onMounted(() => document.addEventListener('pointerdown', onClick))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onClick));
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
