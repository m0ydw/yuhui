//接收
//并处理
import { WebSocketClient } from '../clientType'
import { newStrokeFlow } from '@/utils'
export function addMainBoardEvent(client: WebSocketClient, Flow: ReturnType<typeof newStrokeFlow>) {
  //进入房间
  ;(client.on('whoJoins', (data) => {
    const aim = data.data
    Flow.newUser(aim.user)
  }),
    //新笔画
    client.on('newStroke', (data) => {
      const aim = data.data
      Flow.pushStroke(aim.willPush, aim.user)
    }),
    //新点
    client.on('comePoints', (data) => {
      const aim = data.data
      Flow.pushOtherPoints(aim.points, aim.user)
    }),
    //完成
    client.on('finishStroke', (data) => {
      const aim = data.data
      Flow.setFinish(aim.user)
    }))
  //退出
}
