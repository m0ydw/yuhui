import { ref } from 'vue'
import type messageContainer from '@/components/messageNotice/messageContainer.vue'
const baseMessage = ref()
const userMessage = ref()

export function initBase(aim: any) {
  baseMessage.value = aim
}

export function initUser(aim: any) {
  userMessage.value = aim
}

export function addBaseMessager(text: string) {
  if (baseMessage.value) {
    baseMessage.value.addMessage(text)
  }
}
export function addUserMessager(text: string, userText: string) {
  if (userMessage.value) {
    userMessage.value.addMessage(text, userText)
  }
}
