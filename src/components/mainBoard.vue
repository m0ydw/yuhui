<!-- 多人路由https://localhost:5173/draw?roomId=mig0m6qpd04b26-6e2a1915d12f6c1e -->

<template>
  <div>
    <canvas width="600" height="600" id="drawboard"></canvas>
    <canvas id="cursorCanvas"></canvas>
    <canvas id="otherCursorCanvas"></canvas>
    <scale :board=boardData :ctx=ctx :canvas=canvas v-if="boardReady && boardData" @resize="scaleResize"></scale>
    <roomUsersNav v-if="boardReady && roomName" :room-name="roomName" :room-id="roomIdStr" :homeowner="homeowner"
      :users="onlineUsers" />
    <boardSection @select="handleSectionEmit"></boardSection>
    <!-- 弹窗 -->

  </div>
</template>

<script setup lang="ts">
import flexPop from './flexPop.vue'
import boardSection from './boardSection.vue'
import scale from './toolBar/scale.vue'
import { ref, shallowRef, onMounted, onUnmounted, type Ref, } from 'vue'
import roomUsersNav from '@/components/roomUsersNav.vue'
import roomInitLoading from '@/components/sectionPop/roomInitLoading.vue'
import {
  canvasPointer,//捕获指针至canvas
  type Board, type Stroke,
  sendIAmJoin,//发送信息的封装
  addMainBoardEvent,//挂载websocket事件
  cursorRender,
  connectCursor,
  addCursorEvent,
  delCursorEvent,
  renderOtherCursor,
  cursorMoveSend,
  myWebsocketClient,//websocket实例
  changeUserId,
  getUserId,
  addUsers,//初始化其他用户的cursor
  addBaseMessager,
} from '@/models'
import {
  newStrokeFlow,//新建用户队列
  setupHighResolutionCanvas,//高分辨率canvas
  resizeDrawCanvas,//挂载缩放事件
  resizeCursorCanvas,
  newBoard,//new一个board二维表格空间
} from '@/utils'
import { useRoute, useRouter } from 'vue-router'
import useClientStore from '@/stores/clientStores'
import userDataStore from '@/stores/userDataStores'
import { URLSERVER } from '@/api'
const userDataStoreTEAMPLATE = userDataStore()
const router = useRouter()
const route = useRoute()
let hasPlayer = false
//输入队列
let userQueue: null | ReturnType<typeof newStrokeFlow> = null
//用于初始化
let others: string[] | null = []
let History: Stroke[] | null = []
let otherCursors: any = []
// // 进入单人模式
// router.push('/draw')
// 进入多人模式，指定房间
// router.push('')

//画板
const canvas = shallowRef()
const ctx = shallowRef()
const windowVw = ref()
const windowVh = ref()
let boardData: Board | undefined = undefined
let boardReady = ref(false)
const roomIdStr = ref('')
const roomName = ref('')
const homeowner = ref('')
const onlineUsers = ref<{ userId: string; name: string; avatar: string }[]>([])
let onWhoJoinsHandler: ((d: any) => void) | null = null
let onWhoExitHandler: ((d: any) => void) | null = null
let onUserKickedHandler: ((d: any) => void) | null = null
let onKickedOutHandler: ((d: any) => void) | null = null
let removeMainBoardEvent: null | (() => void) = null
let onJoinStatusInitHandler: ((d: any) => void) | null = null
let onJoinStatusChunkHandler: ((d: any) => void) | null = null
let onJoinStatusDoneHandler: ((d: any) => void) | null = null
//清理函数
let cleanup: (() => void) | null = null
// 延迟获取store实例，避免在Pinia挂载前使用
let clientStore: ReturnType<typeof useClientStore> | null = null
//画板初始化

onMounted(async () => {
  //确定模式
  await router.isReady()
  const roomId = route.query.roomId
  if (roomId) {
    roomIdStr.value = roomId.toString()
    //先进入多人
    myWebsocketClient.disconnect()
    changeUserId(await myWebsocketClient.connect('draw'))
    //尝试加入对应room
    myWebsocketClient.send(sendIAmJoin(roomId.toString(), getUserId()))
    //等待服务器响应
    try {
      const popRef = getPopFlex()
      const pop = popRef?.value?.open(roomInitLoading, { message: '房间初始化中' }, false)

      // 提前挂载用户增减监听，避免 JoinStatus 分片期间错过 whoJoins
      onWhoJoinsHandler =
        onWhoJoinsHandler ||
        ((raw: any) => {
          const d = raw?.data
          if (!d?.user) return
          if (onlineUsers.value.some((u) => u.userId === d.user)) return
          onlineUsers.value.push({
            userId: d.user,
            name: d.name || d.user,
            avatar: `${URLSERVER}${d.hisAvatar || '/uploads/avatar/No-avatar.jpg'}?t=${Date.now()}`,
          })
        })

      onWhoExitHandler =
        onWhoExitHandler ||
        ((raw: any) => {
          const d = raw?.data
          if (!d?.user) return
          onlineUsers.value = onlineUsers.value.filter((u) => u.userId !== d.user)
        })

      onUserKickedHandler =
        onUserKickedHandler ||
        ((raw: any) => {
          const d = raw?.data
          if (!d?.user) return
          onlineUsers.value = onlineUsers.value.filter((u) => u.userId !== d.user)
        })

      onKickedOutHandler =
        onKickedOutHandler ||
        (() => {
          addBaseMessager('您已被请出该房间')
          router.replace({ name: 'allRoom' })
        })

      myWebsocketClient.on('whoJoins', onWhoJoinsHandler)
      myWebsocketClient.on('whoExit', onWhoExitHandler)
      myWebsocketClient.on('userKicked', onUserKickedHandler)
      myWebsocketClient.on('kickedOut', onKickedOutHandler)

      const joinRes = await new Promise<{ meta: any; history: Stroke[] }>((resolve, reject) => {
        let meta: any = null
        const mergedHistory: Stroke[] = []
        let done = false

        const cleanup = () => {
          if (onJoinStatusInitHandler) myWebsocketClient.off('JoinStatusInit', onJoinStatusInitHandler)
          if (onJoinStatusChunkHandler) myWebsocketClient.off('JoinStatusChunk', onJoinStatusChunkHandler)
          if (onJoinStatusDoneHandler) myWebsocketClient.off('JoinStatusDone', onJoinStatusDoneHandler)
          onJoinStatusInitHandler = null
          onJoinStatusChunkHandler = null
          onJoinStatusDoneHandler = null
        }

        const timer = setTimeout(() => {
          if (done) return
          done = true
          cleanup()
          reject(new Error('房间初始化超时'))
        }, 30000)

        onJoinStatusInitHandler = (raw: any) => {
          meta = raw?.data || null
        }

        onJoinStatusChunkHandler = (raw: any) => {
          const arr = raw?.data?.strokes
          if (Array.isArray(arr)) mergedHistory.push(...(arr as Stroke[]))
        }

        onJoinStatusDoneHandler = (raw: any) => {
          if (done) return
          //关闭弹窗
          pop.realExit()
          done = true
          clearTimeout(timer)
          cleanup()

          if (!meta?.status) {
            reject(new Error('加入房间失败：初始化数据异常'))
            return
          }

          resolve({ meta, history: mergedHistory })
        }

        myWebsocketClient.on('JoinStatusInit', onJoinStatusInitHandler)
        myWebsocketClient.on('JoinStatusChunk', onJoinStatusChunkHandler)
        myWebsocketClient.on('JoinStatusDone', onJoinStatusDoneHandler)
      })

      // 结束 loading mask，允许用户继续操作
      popRef?.value?.close()

      others = joinRes.meta.others
      History = joinRes.history
      otherCursors = joinRes.meta.otherCursors

      roomName.value = joinRes.meta.roomName || ''
      homeowner.value = joinRes.meta.homeowner || ''

      //头像存储（其他用户头像等）
      userDataStoreTEAMPLATE.setUSERS(joinRes.meta.allAvatar || [])

      // 初始化在线用户列表（包含自己）
      const onlineIds: string[] = [getUserId(), ...(joinRes.meta.others || [])]
      const avatarArr: { userkey: string; avatar: string; name: string }[] = Array.isArray(joinRes.meta.allAvatar)
        ? joinRes.meta.allAvatar
        : []
      const avatarMap = new Map(avatarArr.map((a) => [a.userkey, a]))
      const computedUsers = onlineIds
        .map((id) => {
          const info = avatarMap.get(id)
          if (!info) return null
          return {
            userId: id,
            name: info.name,
            avatar: `${URLSERVER}${info.avatar}?t=${Date.now()}`,
          }
        })
        .filter(Boolean) as any[]

      // 合并：避免初始化分片期间 whoJoins 已经把人 push 进列表后被覆盖
      const userMap = new Map((onlineUsers.value || []).map((u) => [u.userId, u]))
      computedUsers.forEach((u) => {
        if (!u) return
        userMap.set(u.userId, u)
      })
      onlineUsers.value = Array.from(userMap.values())

      // 初始化事件监听（更新导航栏在线用户列表）
      onWhoJoinsHandler =
        onWhoJoinsHandler ||
        ((raw: any) => {
          const d = raw?.data
          if (!d?.user) return
          if (onlineUsers.value.some((u) => u.userId === d.user)) return
          onlineUsers.value.push({
            userId: d.user,
            name: d.name || d.user,
            avatar: `${URLSERVER}${d.hisAvatar || '/uploads/avatar/No-avatar.jpg'}?t=${Date.now()}`,
          })
        })

      onWhoExitHandler =
        onWhoExitHandler ||
        ((raw: any) => {
          const d = raw?.data
          if (!d?.user) return
          onlineUsers.value = onlineUsers.value.filter((u) => u.userId !== d.user)
        })

      onUserKickedHandler =
        onUserKickedHandler ||
        ((raw: any) => {
          const d = raw?.data
          if (!d?.user) return
          onlineUsers.value = onlineUsers.value.filter((u) => u.userId !== d.user)
        })

      onKickedOutHandler =
        onKickedOutHandler ||
        (() => {
          addBaseMessager('您已被请出该房间')
          router.replace({ name: 'allRoom' })
        })

      myWebsocketClient.on('whoJoins', onWhoJoinsHandler)
      myWebsocketClient.on('whoExit', onWhoExitHandler)
      myWebsocketClient.on('userKicked', onUserKickedHandler)
      myWebsocketClient.on('kickedOut', onKickedOutHandler)

      hasPlayer = true
    } catch (e: any) {
      // 出错时关闭 loading mask，避免卡死
      getPopFlex()?.value?.close()
      addBaseMessager(e?.message || '无法加入房间')
      hasPlayer = false
    }
  } else {
    //单人
  }
  //
  canvas.value = document.getElementById('drawboard')
  //核心逻辑
  if (canvas.value) {
    windowVw.value = window.innerWidth
    windowVh.value = window.innerHeight
    //设置高分辨率ctx
    ctx.value = setupHighResolutionCanvas(canvas.value)
    //board实例（增大网格尺寸，减少 tile 边界与重建次数）
    boardData = newBoard(2048, windowVw, windowVh)
    boardReady.value = true
    //初始化store
    clientStore = useClientStore()
    //创建用户队列
    userQueue = newStrokeFlow(getUserId(), ctx.value, boardData)
    // board关联userqueue
    boardData.containQueue(userQueue)
    clientStore.setFlow(userQueue)
    //注册鼠标交互监听
    cleanup = canvasPointer(canvas.value, ctx.value, boardData, userQueue)
    // 初次渲染
    boardData.render(ctx.value, canvas.value)
    //挂载实时改变分辨率的函数
    if (boardData)
      window.addEventListener(
        'resize',
        () => resizeDrawCanvas(canvas.value, windowVw, windowVh, boardData!, ctx.value)
      )
    //初始绘图样式？
  }
  //不同的逻辑(多人)
  if (hasPlayer && userQueue) {
    //初始化queue
    if (others)
      userQueue.newOthers(others)
    //初始化历史操作
    if (History && boardData)
      boardData.initBoard(History, ctx.value, canvas.value)

    //挂载监听
    removeMainBoardEvent = addMainBoardEvent(myWebsocketClient, userQueue)

    //取消引用释放内存
    others = null
    History = null
  } else {


  }


  /*          --------------------cursorCanvas初始化 ------------------------------                   */

  let cursorCanvas = document.getElementById('cursorCanvas') as HTMLCanvasElement
  let cursorCtx: CanvasRenderingContext2D
  if (cursorCanvas) {
    cursorCtx = setupHighResolutionCanvas(cursorCanvas)
    // 监听的是下层
    connectCursor(cursorCanvas, cursorCtx, boardData!, canvas.value)
    canvas.value.addEventListener('pointermove', (e: PointerEvent) => {
      //传输信息
      cursorMoveSend(boardData!, e)
      //
      cursorRender(e)
    })
    canvas.value.addEventListener('pointerleave', () => {
      cursorCtx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    })
  }

  // resize函数
  window.addEventListener(
    'resize',
    () => {
      resizeCursorCanvas(cursorCanvas)
    }

  )

  /*          --------------------otherCursorCanvas初始化 ------------------------------                   */
  let otherCursorCanvas = document.getElementById('otherCursorCanvas') as HTMLCanvasElement
  let otherCursorCtx: CanvasRenderingContext2D
  if (otherCursorCanvas) {
    otherCursorCtx = setupHighResolutionCanvas(otherCursorCanvas)
    // 设置监听
    addCursorEvent(boardData!, otherCursorCtx)
    //初始化
    if (otherCursors)
      addUsers(otherCursors)

  }
  //resize函数
  window.addEventListener(
    'resize',
    () => {
      resizeCursorCanvas(otherCursorCanvas)
      renderOtherCursor(true)//强制渲染
    }

  )
  //取消引用释放内存
  otherCursors = null


})

//画板结束时
onUnmounted(() => {
  cleanup?.()
  clientStore?.setFlow(null)
  removeMainBoardEvent?.()
  removeMainBoardEvent = null
  delCursorEvent()
  if (onJoinStatusInitHandler) myWebsocketClient.off('JoinStatusInit', onJoinStatusInitHandler)
  if (onJoinStatusChunkHandler) myWebsocketClient.off('JoinStatusChunk', onJoinStatusChunkHandler)
  if (onJoinStatusDoneHandler) myWebsocketClient.off('JoinStatusDone', onJoinStatusDoneHandler)
  onJoinStatusInitHandler = null
  onJoinStatusChunkHandler = null
  onJoinStatusDoneHandler = null
  if (onWhoJoinsHandler) myWebsocketClient.off('whoJoins', onWhoJoinsHandler)
  if (onWhoExitHandler) myWebsocketClient.off('whoExit', onWhoExitHandler)
  if (onUserKickedHandler) myWebsocketClient.off('userKicked', onUserKickedHandler)
  if (onKickedOutHandler) myWebsocketClient.off('kickedOut', onKickedOutHandler)
})
//cursorcanvas初始化



//scale子组件缩放使用的函数
function scaleResize(e: PointerEvent) {
  cursorRender(e)
  renderOtherCursor(true)//强制渲染
}
//弹窗组件
import exportToImage from './sectionPop/exportToImage.vue'
import saveBoard from './sectionPop/saveBoard.vue'
import loadBoard from './sectionPop/loadBoard.vue'
import clearBoard from './sectionPop/clearBoard.vue'
import { getPopFlex } from '@/models/flexpop/flexpop'
const handleSectionEmit = (key: string) => {
  let popRef = getPopFlex()
  if (popRef === null) return
  switch (key) {
    case 'save':
      popRef.value.open(saveBoard, { boardData: boardData! })
      break
    case 'load':
      popRef.value.open(loadBoard, {
        boardData: boardData!,
        ctx: ctx.value,
        canvas: canvas.value,
        userQueue: userQueue!,
      })
      break
    case 'export':
      console.log(11)
      popRef.value.open(exportToImage, { boardData: boardData! })
      break
    case 'clear':
      popRef.value.open(clearBoard, {
        boardData: boardData!,
        ctx: ctx.value,
        canvas: canvas.value,
        userQueue: userQueue!,
        online: hasPlayer,
      })
      break
    case 'grid':
      if (boardData && ctx.value && canvas.value) {
        boardData.toggleGrid()
        boardData.render(ctx.value, canvas.value)
      }
      break
  }
}

</script>

<style scoped>
button {
  position: absolute;
  left: 0;
  top: 0;
}

#drawboard {
  width: 100vw;
  height: 100vh;
  z-index: 1;
  cursor: none;
}

#cursorCanvas {
  width: 100vw;
  height: 100vh;
  position: absolute;
  z-index: 2;
  left: 0;
  top: 0;
  pointer-events: none;
}

#otherCursorCanvas {
  width: 100vw;
  height: 100vh;
  position: absolute;
  z-index: 3;
  left: 0;
  top: 0;
  pointer-events: none;
}
</style>
