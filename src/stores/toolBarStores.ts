import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { toolMode } from '@/models'

const toolBarData = defineStore('toolBar', () => {
  //toolbar
  const nowTool = ref<toolMode>('pen')
  //actions
  function setTool(tool: toolMode) {
    nowTool.value = tool
  }

  //selectBar
  const displaySelectBar = ref(false)
  //获取和改变
  function isNeedDisplay() {
    return displaySelectBar.value
  }
  function changeSelectBar(aim: boolean) {
    displaySelectBar.value = aim
  }
  return {
    nowTool,
    setTool,
    isNeedDisplay,
    changeSelectBar,
  }
})

export default toolBarData
