import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { toolMode } from '@/models'

const toolBarData = defineStore('toolBar', () => {
  const nowTool: toolMode = 'hand'
})
