import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { strokeFlow } from '@/models'

const useClientStore = defineStore('clientStore', () => {
  const flowRef = ref<strokeFlow | null>(null)

  function setFlow(flow: strokeFlow | null) {
    flowRef.value = flow
  }

  function getFlow() {
    return flowRef.value
  }

  return {
    flowRef,
    setFlow,
    getFlow,
  }
})

export default useClientStore
