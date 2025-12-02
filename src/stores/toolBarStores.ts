import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { toolMode } from '@/models'

const toolBarData = defineStore('toolBar', () => {
  //toolbar
  // type有：hand,pen,eraser
  const nowTool = ref<toolMode>('pen')
  //actions
  function setTool(tool: toolMode) {
    nowTool.value = tool
  }
  function getTool() {
    return nowTool.value
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
  const nowColor = ref('#354552')
  //改变color
  function changeNowColor(aim: string) {
    nowColor.value = `${aim}`
  }
  function getNowColor() {
    return nowColor.value
  }
  const penSize = ref(5)
  function getPenSize() {
    return penSize.value
  }
  function setPenSize(aim: number) {
    penSize.value = aim
  }
  return {
    nowTool,
    setTool,
    isNeedDisplay,
    changeSelectBar,
    changeNowColor,
    getNowColor,
    getPenSize,
    setPenSize,
    getTool,
  }
})

export default toolBarData
