import { ref } from 'vue'
const popflex = ref()
export function initPopFlex(aim: any) {
  popflex.value = aim
}
export function getPopFlex() {
  if (!popflex.value) {
    return null
  }
  return popflex
}
