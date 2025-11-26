<template>
  <div>
    <toolBar></toolBar>
    <selectBar></selectBar>
    <mainBoard></mainBoard>
    <connect></connect>

  </div>
</template>

<script setup lang="ts">
import mainBoard from '../components/mainBoard.vue'
import toolBar from '../components/toolBar.vue';
import selectBar from '@/components/toolBar/selectBar.vue';
import connect from '@/components/user/connect.vue';
</script>

<style scoped></style>
