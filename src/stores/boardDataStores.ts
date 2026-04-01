import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Board } from '@/models'

const boardDataStores = defineStore('boardDataStores', () => {
  let board: Board | null = null

  function setBoard(aim: Board | null) {
    board = aim
  }

  function getBoard() {
    return board
  }

  return {
    setBoard,
    getBoard,
  }
})

export default boardDataStores
