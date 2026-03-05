<template>
  <div class="container" :class="props.type">
    <messageItem v-for="[key, item] in messageMap" :text="item.text" :userText="item.userText" :type="props.type"
      :key="key" :id="key" @tryClose="close">
    </messageItem>
  </div>
</template>

<script setup lang="ts">
import messageItem from './messageItem.vue';
import { shallowReactive } from 'vue';
interface Prop {
  type: 'baseNotice' | 'userNotice',
}
const props = defineProps<Prop>()

const messageMap = shallowReactive(new Map<string, { text: string, userText: string }>)//方便扩展

const close = (key: string) => {
  if (messageMap.has(key)) {
    messageMap.delete(key)
  }
}
let id = 0
const addMessage = (text: string, userText: string = 'isnotUser') => {
  const key = `${++id}`
  //添加
  messageMap.set(key, { text, userText })
}

//暴露函数
defineExpose({
  addMessage
})
</script>

<style scoped>
.container {
  position: absolute;
  width: 350px;
  height: 100px;
  pointer-events: none;
  z-index: 1000000;
}

.baseNotice {
  left: 50%;
  transform: translateX(-50%);
  top: 10px;
}

.userNotice {
  left: 10px;
  bottom: 10px;
}
</style>
