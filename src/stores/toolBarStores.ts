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
  /*               selectBar是否展示        */
  const displaySelectBar = ref(false)
  //获取和改变
  function isNeedDisplay() {
    return displaySelectBar.value
  }
  function changeSelectBar(aim: boolean) {
    if (displaySelectBar.value !== aim) displaySelectBar.value = aim
  }
  //pen的相关值
  const nowColor = ref('#000000')
  //改变color
  function changeNowColor(aim: string) {
    nowColor.value = `${aim}`
  }
  function getNowColor() {
    return nowColor.value
  }
  return {
    nowTool,
    setTool,
    isNeedDisplay,
    changeSelectBar,
    changeNowColor,
    getNowColor,
  }
})

export default toolBarData
