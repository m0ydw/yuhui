<template>
  <div>
    <oneRoom :roomData=data></oneRoom>
  </div>
</template>

<script setup lang="ts">
import { myWebsocketClient } from '@/models/webSocket/cilentExample';
import oneRoom from '@/components/oneRoom.vue';
import { ref, onMounted } from 'vue';

myWebsocketClient.connect()
const data = ref({ roomId: 'mijud9t9a04734-1382b3a638ac942c' })
</script>

<style scoped></style>
