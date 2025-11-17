import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { toolMode } from '@/models'

const toolBarData = defineStore('toolBar', () => {
  const nowTool = ref<toolMode>('pen')

  //actions
  function setTool(tool: toolMode) {
    nowTool.value = tool
  }
  return {
    nowTool,
    setTool,
  }
})

export default toolBarData
