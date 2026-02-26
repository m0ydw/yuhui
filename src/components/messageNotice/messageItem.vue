<template>
  <div class="message">
    {{ text }}
    <button @click="closeOne">关闭</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text: string,
  type: 'baseNotice' | 'userNotice',
  id: string
}
const props = withDefaults(defineProps<Props>(), {
  text: 'error',
  type: 'baseNotice',
  id: ''
})
interface Emit {
  (e: 'tryClose', id: string): void
}
const emit = defineEmits<Emit>()

const closeOne = () => {//关闭
  emit('tryClose', props.id)
}
</script>

<style scoped>
.message {
  position: absolute
}
</style>
