<template>
  <div class="oneRoom">
    <button class="enter" @click="enter">进入</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter()
interface roomdata {
  roomId: string
}
interface Prop {
  roomData: roomdata
}
const props = defineProps<Prop>()
function enter() {
  router.replace({ name: 'draw', query: { roomId: `${props.roomData.roomId}` } })
}

</script>

<style scoped>
.oneRoom {
  width: 250px;
  height: 100px;
  border: 1px solid black;
  position: relative;
  display: inline-block;
}

.enter {
  all: unset;
  position: absolute;
  right: 5px;
  bottom: 5px;
  border: 1px solid rgb(108, 108, 108);
  border-radius: 3px;
  width: 35px;
  height: 24px;
  font-size: 12px;
  text-align: center;
  color: rgb(97, 97, 97);
  cursor: pointer;
}

.enter:hover {
  background-color: silver;
  transform: scale(1.1);
}

.enter:active {
  background-color: rgb(170, 170, 170);
  transform: scale(0.95);
}
</style>
