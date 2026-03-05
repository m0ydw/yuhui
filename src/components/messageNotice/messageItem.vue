<template>
  <Transition :name="transitionName" appear>
    <div v-show="visible" @mouseenter="mouseEnter" @mouseleave="mouseLeave" class="message"
      :class="[`message--${type}`]" ref="messageItem">
      <!-- 关闭按钮 -->
      <div class="message__close" @click="closeOne">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor"
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </div>

      <!-- 标题 -->
      <div class="message__header">
        {{ titleText }}
      </div>

      <!-- base内容 -->
      <div class="message__content" v-if="!isUser">
        {{ text }}
      </div>
      <!-- user内容 -->
      <div class="message__content" v-if="isUser">
        <p><span class="userName">{{ text }}</span>
          {{ userText }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef, onUnmounted } from 'vue'

interface Props {
  text: string
  type: 'baseNotice' | 'userNotice'
  id: string
  userText: string
}

const props = withDefaults(defineProps<Props>(), {
  text: 'error',
  type: 'baseNotice',
  id: '',
  userText: 'err'
})

interface Emit {
  (e: 'tryClose', id: string): void
}
const messageItem = shallowRef()

const emit = defineEmits<Emit>()

const visible = ref(true)

const transitionName = computed(() =>
  props.type === 'userNotice' ? 'slide-left' : 'slide-top'
)
//是user计算属性时
const isUser = computed(() => props.type === 'userNotice')

const titleText = computed(() =>
  props.type === 'userNotice' ? '消息' : '提示'
)

const closeOne = () => {
  visible.value = false
  setTimeout(() => {
    emit('tryClose', props.id)
  }, 1000)
}

//设置延时删除
let cursor = false

setTimeout(() => {
  if (!cursor) {
    closeOne()
  } else {
    //监听
    messageItem.value?.addEventListener('mouseleave', () => {
      closeOne()
    })
  }
}, 3000)

const mouseEnter = () => {
  cursor = true
}
const mouseLeave = () => {
  cursor = false
}

onUnmounted(() => {
  messageItem.value?.removeEventListener('mouseleave', mouseLeave)
})
</script>

<style scoped>
.message {
  position: absolute;
  min-width: 280px;
  max-width: 400px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  border-radius: 12px;
  box-shadow:
    0 4px 20px rgba(59, 130, 246, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.1);
  pointer-events: auto;
  overflow: hidden;
  z-index: 10000;
}

.message::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 12px 0 0 12px;
}

.message--userNotice::before {
  background: linear-gradient(180deg, #0ea5e9 0%, #38bdf8 100%);
}

.message__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 1s ease;
}

.message__close:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.message__header {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
  padding-right: 20px;
  letter-spacing: 0.5px;
}

.message--userNotice .message__header {
  color: #0369a1;
}

.message__content {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
  word-break: break-word;
}

/*                         top */
/*                                  from                        */
.slide-top-enter-from {
  opacity: 0;
  transform: translateY(-120%) scale(0.95);
}

.slide-top-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1) !important;
}

/*                    active */
.slide-top-enter-active,
.slide-top-leave-active {
  transition: all 0.5s !important;
}

/*                            to */
.slide-top-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1) !important;
}

.slide-top-leave-to {
  opacity: 0;
  transform: translateY(-120%) scale(0.95) !important;
}

/*                       left                    */
/* from */
.slide-left-leave-from {
  transform: translateX(0) scale(1) !important;
}

.slide-left-enter-from {
  transform: translateX(-120%) scale(0.95) !important;
}

/* active */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.5s !important;
}

/* to */
.slide-left-enter-to {
  transform: translateX(0) scale(1) !important;
}

.slide-left-leave-to {
  transform: translateX(-120%) scale(0.95) !important;
}

.message:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 30px rgba(59, 130, 246, 0.2),
    0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}
</style>