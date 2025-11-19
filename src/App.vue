<template>
  <mainBoard></mainBoard>
  <toolBar></toolBar>
  <connect></connect>
</template>

<script setup lang="ts">
import mainBoard from './components/mainBoard.vue'
import toolBar from './components/toolBar.vue';
import connect from './components/user/connect.vue';
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
