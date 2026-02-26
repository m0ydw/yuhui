import { createAllRoomMap, myWebsocketClient } from '@/models'

let RoomMap: ReturnType<typeof createAllRoomMap> | null = null
function roomChange(data: any) {
  if (!RoomMap) return
  const aim = data.data
  RoomMap.roomChange(aim.roomState)
}
function roomDel(data: any) {
  if (!RoomMap) return
  const aim = data.data
  RoomMap.delRoom(aim.roomId)
}
function roomAdd(data: any) {
  if (!RoomMap) return
  const aim = data.data
  RoomMap.addRoom(aim.roomState)
}

export function addAllRoomEvent(aim: ReturnType<typeof createAllRoomMap>) {
  RoomMap = aim
  myWebsocketClient.on('roomChange', roomChange)
  myWebsocketClient.on('roomDel', roomDel)
  myWebsocketClient.on('roomAdd', roomAdd)
}

function delAllRoomEvent() {
  myWebsocketClient.off('roomChange', roomChange)
  myWebsocketClient.off('roomDel', roomDel)
  myWebsocketClient.off('roomAdd', roomAdd)
}
