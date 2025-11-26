<template>
  <div class="penSelect">
    <colorSelectModel @update:modelValue="colorChange"></colorSelectModel>
  </div>
</template>

<script setup lang="ts">
import colorSelectModel from './colorSelectModel.vue';
import toolBarData from '@/stores/toolBarStores';
const toolBarStores = toolBarData()
const colorChange = (aim: string) => {
  toolBarStores.changeNowColor(aim)
}
</script>

<style scoped></style>
