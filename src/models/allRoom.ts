import { type roomState } from './types'
import { reactive } from 'vue'
export function createAllRoomMap() {
  const roomMap = reactive(new Map<string, roomState>())
  function addRoom(data: roomState) {
    roomMap.set(data.roomId, data)
  }
  function delRoom(id: string) {
    if (roomMap.has(id)) roomMap.delete(id)
  }
  //改变房间状态
  function roomChange(data: roomState) {
    if (roomMap.has(data.roomId)) {
      const room = roomMap.get(data.roomId)
      Object.assign(room!, data)
    }
  }
  //初始化
  function roomInIt(data: roomState[]) {
    for (const value of data) {
      addRoom(value)
    }
  }
  function getValues() {
    return [...roomMap.values()]
  }
  return {
    addRoom,
    delRoom,
    roomChange,
    roomInIt,
    getValues,
  }
}
