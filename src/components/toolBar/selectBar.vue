<template>
  <div class="selectBar" ref="box" v-if="toolBarStore.isNeedDisplay()">
    <penSelect></penSelect>
  </div>
</template>

<script setup lang="ts">
// 组件
import penSelect from './penSelect/penSelect.vue';
// 自身逻辑
import toolBarData from '@/stores/toolBarStores';
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
