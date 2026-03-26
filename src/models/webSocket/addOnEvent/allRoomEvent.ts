import { createAllRoomMap, myWebsocketClient } from '@/models'
import { type Reactive } from 'vue'
let RoomMap: ReturnType<typeof createAllRoomMap> | null = null
let Aimcount: Reactive<Map<string, { on: boolean; count: number }>> | null = null
function roomChange(data: any) {
  if (!RoomMap) return
  const aim = data.data
  RoomMap.roomChange(aim.roomState)
}
function roomDel(data: any) {
  if (!RoomMap || !Aimcount) return
  const aim = data.data
  RoomMap.delRoom(aim.roomId)
  Aimcount.delete(aim.roomId)
}
function roomAdd(data: any) {
  if (!RoomMap || !Aimcount) return
  const aim = data.data
  RoomMap.addRoom(aim.roomState)
  Aimcount.set(aim.roomState.roomId, { on: false, count: 0 })
}
function willClose(data: any) {
  if (!RoomMap) return
  const aim = data.data
}
function roomWillDel(data: any) {
  if (!Aimcount) return
  const aim = data.data
  if (Aimcount.has(aim.roomId)) {
    Aimcount.get(aim.roomId)!.on = true
    Aimcount.get(aim.roomId)!.count = aim.count
    return
  }
  Aimcount.set(aim.roomId, { on: true, count: aim.count })
}

export function addAllRoomEvent(
  aim: ReturnType<typeof createAllRoomMap>,
  count: Reactive<Map<string, { on: boolean; count: number }>>,
) {
  RoomMap = aim
  Aimcount = count
  myWebsocketClient.on('roomChange', roomChange)
  myWebsocketClient.on('roomDel', roomDel)
  myWebsocketClient.on('roomAdd', roomAdd)
  myWebsocketClient.on('roomWillDel', roomWillDel)
}

function delAllRoomEvent() {
  myWebsocketClient.off('roomChange', roomChange)
  myWebsocketClient.off('roomDel', roomDel)
  myWebsocketClient.off('roomAdd', roomAdd)
  myWebsocketClient.off('roomWillDel', roomWillDel)
}
