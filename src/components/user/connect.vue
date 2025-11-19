<template>
  <div class="connect" v-if="myWebsocketClient">
    <h2></h2>
    <button @click="myWebsocketClient.connect">连接</button>
    <button @click="myWebsocketClient.disconnect">断开</button>
    <button @click="createRoom"></button>
    <h2>roomId{{ roomId }}</h2>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { myWebsocketClient } from '@/models/webSocket/cilentExample';
import { request, type createRoom } from '@/api';

const roomId = ref('')
onMounted(() => {

})

async function createRoom() {
  const data = await request<createRoom>('api/createCanvas')
  roomId.value = data.roomId
}

</script>

<style scoped>
.connect {
  width: 200px;
  height: 50px;
  position: absolute;
  left: 0;
  top: 0;
}
</style>
