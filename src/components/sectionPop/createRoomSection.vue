<template>
  <div class="createRoom">
    <div class="header">
      <div class="title">创建房间</div>
      <button class="cls" @click="emit('close')">关闭</button>
    </div>
    <div class="body">
      <div class="side">
        <div class="sideTitle">
          工程
        </div>
        <div class="newBoard row" :class="{ active: selectedId === 'new' }" @click="select('new')">
          <div class="newBtn">新建画板</div>
        </div>
        <div class="list">
          <div v-for="p in projects" :key="p.id" class="row" :class="{ active: selectedId === p.id }"
            @click="select(p.id)">
            <img v-if="p.previewDataUrl" class="thumb" :src="p.previewDataUrl" alt="图片" />
            <div class="rowText">
              <div class="rowTitle">{{ p.name }}</div>
              <div class="rowSub">{{ formatTime(p.updatedAt) }} · {{ p.strokeCount }} 笔</div>
            </div>
          </div>
        </div>
      </div>
      <div class="main">
        <div class="previewBox">
          <img v-if="selected?.previewDataUrl" class="preview" :src="selected.previewDataUrl" alt="预览图" />
        </div>
        <div class="footer">
          <div class="meta">
            <div class="metaTitle">
              {{ selected ? selected.name : '' }}
            </div>
            <div class="roomIdBox">
              <span class="roomIdTitle">
                房间ID
              </span>
              <div class="roomId">
                {{ roomId }}
              </div>
              <div class="roomIdBtn" :class="{ disabled: freshIng }" @click="freshRoomId()">
                刷新{{ freshIng ? `(${countDown})` : '' }}
              </div>
            </div>
            <div class="nameBox">
              <span class="nameTitle">
                房间名
              </span>
              <input type="text" class="roomName" v-model="roomName" @input="handleInput">
            </div>
            <div class="roomNumberBox">
              <span class="roomNumberTitle">人数</span>
              <input type="text" class="roomNumber" @change="handleNumber" value="2">
            </div>


          </div>
          <div class="action">
            <div class="createRoomBtn" @click="createRoomAction" :class="{ disable: isReqIng }">
              创建房间
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
const props = defineProps<{
  // 定义需要的 props 类型
}>()
const emit = defineEmits<{ close: [] }>()
const selectedId = ref<string>('new')//默认选中新建
const select = (id: string) => {
  selectedId.value = id
}
const selected = computed(() => {
  if (selectedId.value === 'new') return {
    id: 'new',
    name: '新建画板',
    createdAt: null,
    previewDataUrl: null,
    strokeCount: 0,
  }
  return projects.value.find(p => p.id === selectedId.value)
})
//加载
import type { BoardProjectMeta } from '@/utils/boardProjectStorage'
import { listBoardProjects, getBoardProjectDetail } from '@/utils/boardProjectStorage';
const projects = ref<BoardProjectMeta[]>([])//工程列表
//时间戳转换
function formatTime(ts: number | null | undefined) {
  if (!ts) return ''

  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}



//roomid
import { refresh, request, type roomIdData } from '@/api';
import { addBaseMessager, type Stroke } from '@/models';
const roomId = ref('11111')
const freshIng = ref(false)
const countDown = ref(10)
let timer: null | number = null
onMounted(async () => {
  //roomid读取
  const localroomid = localStorage.getItem('roomId')
  if (localroomid) {
    roomId.value = localroomid
  }
  //工程读取
  projects.value = await listBoardProjects()
})
async function freshRoomId() {
  //正在请求则return
  if (freshIng.value) return
  freshIng.value = true
  //请求
  const res = await request<roomIdData>('api/refreshRoomId', 'GET', {}, true)
  if (res.code === 401) {
    addBaseMessager(res.message)//刷新失败
    startCountDown()//开始倒计时
    return
  }
  //成功（存储）        第二次未刷新直接展示roomid
  localStorage.setItem('roomId', res.data.roomId)
  addBaseMessager(res.message) //刷新成功
  //更新
  roomId.value = res.data.roomId
  startCountDown()//开始倒计时
}
//刷新倒计时   设置refreshing=false
const startCountDown = () => {
  countDown.value = 10
  timer = setInterval(() => {
    countDown.value -= 1
    if (countDown.value <= 0 && timer) {
      clearInterval(timer)
      freshIng.value = false
    }
  }, 1000)
}
//清除timer
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

//房间名
const roomName = ref('')


const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.value.length > 20) {
    //截超过20
    roomName.value = target.value.slice(0, 20)
    target.value = roomName.value
  }
}
//人数限制
const peopleLimit = ref(2)
const handleNumber = (e: Event) => {
  const target = e.target as HTMLInputElement
  //限制只能输入数字
  target.value = target.value.replace(/\D/g, '')
  //
  if (Number(target.value) > 10) {
    target.value = '10'
  }
  if (Number(target.value) < 2) {
    target.value = '2'
  }
  peopleLimit.value = Number(target.value)
}
//创建房间请求
import { type createRoomData } from '@/api';
const isReqIng = ref(false)
const createRoomAction = async () => {
  isReqIng.value = true
  if (!roomId.value || !roomName.value) {
    isReqIng.value = false
    return addBaseMessager('请完善信息')
  }

  //获取stroke
  let strokes: Stroke[] | null | undefined = []

  if (selectedId.value !== 'new') {
    const detail = await getBoardProjectDetail(selectedId.value)
    strokes = detail?.strokes
  }
  let hasStroke = false
  if (strokes) {
    hasStroke = strokes.length > 0
  }

  try {
    // 没有初始化笔画：走原有一次性创建
    if (!hasStroke || !strokes || strokes.length === 0) {
      const data = {
        roomId: roomId.value,
        roomName: roomName.value,
        peopleLimit: peopleLimit.value,
        hasStroke: false,
      }
      const res = await request<createRoomData>('api/createRoom', 'POST', data, true)
      if (res.code !== 200) throw new Error(res.message || '创建房间失败')
      addBaseMessager('创建成功')
      emit('close')
      return
    }

    const hasInvalidStroke = strokes.some(item => item === undefined || item === null);
    if (hasInvalidStroke) {
      throw new Error("白板数据包含无效内容，请检查后重试");
    }

    // 分块上传初始化笔画：避免后端请求体超过 2MB
    const encoder = new TextEncoder()
    const byteLen = (s: string) => encoder.encode(s).length
    const overheadBytes = byteLen(
      JSON.stringify({
        roomId: roomId.value,
        chunkIndex: 0,
        totalChunks: 1,
        strokes: [],
      }),
    )

    const MAX_CHUNK_BYTES = 600 * 1024

    const strokeSizes = strokes.map((st) => byteLen(JSON.stringify(st)))
    const chunks: Stroke[][] = []
    let cur: Stroke[] = []
    let curBytes = 0

    for (let i = 0; i < strokes.length; i++) {
      const st = strokes[i]
      const stBytes = strokeSizes[i] || 0
      const willBytes = overheadBytes + curBytes + stBytes
      if (cur.length > 0 && willBytes > MAX_CHUNK_BYTES) {
        chunks.push(cur)
        cur = [st!]
        curBytes = stBytes
      } else {
        cur.push(st!)
        curBytes += stBytes
      }
    }
    if (cur.length) chunks.push(cur)

    const totalChunks = chunks.length
    if (totalChunks <= 0) throw new Error('创建房间失败：初始化分片为空')

    // 1) 创建房间并进入“初始化上传中”（不发送 roomAdd）
    const startRes = await request<createRoomData>('api/createRoom', 'POST', {
      roomId: roomId.value,
      roomName: roomName.value,
      peopleLimit: peopleLimit.value,
      hasStroke: true,
      chunkMode: true,
      totalChunks,
    }, true)

    if (startRes.code !== 200) {
      throw new Error(startRes.message || '创建房间失败')
    }

    // 2) 上传每个 chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunkRes = await request<createRoomData>(
        'api/roomInitChunk',
        'POST',
        {
          roomId: roomId.value,
          chunkIndex: i,
          totalChunks,
          strokes: chunks[i],
        },
        true,
      )
      if (chunkRes.code !== 200) {
        throw new Error(chunkRes.message || '上传初始化数据失败')
      }
    }

    // 3) 合并并发送 roomAdd
    const finishRes = await request<createRoomData>(
      'api/roomInitFinish',
      'POST',
      {
        roomId: roomId.value,
        totalChunks,
      },
      true,
    )
    if (finishRes.code !== 200) {
      throw new Error(finishRes.message || '创建房间失败')
    }

    addBaseMessager('创建成功')
    emit('close')
  } catch (err) {
    console.error(err)
    addBaseMessager('创建房间失败')
  } finally {
    isReqIng.value = false
  }
}
</script>

<style scoped>
.createRoom {
  width: min(980px, 92vw);
  height: min(600px, 80vh);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.header {
  height: 50px;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  background: linear-gradient(180deg, #ffffff, #fafafa);
  border-bottom: 1px solid #eee;
  line-height: 50px;
}

.cls {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
}

.title {
  text-align: center;
  font-weight: 600;
}

.body {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 0;
}

.side {
  border-right: 1px solid #eee;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.sideTitle {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}



.newBtn {
  height: 50px;
  width: 100%;
  line-height: 50px;
  text-align: center;

}

.newBoard.row {
  border: #cfcfcfc7 2px solid;
  border-radius: 10px;
  color: #949393;
  margin-right: 15px;
  width: 193px;
  height: auto;
}

.newBoard.row.active {
  border-color: #409eff;
  background: #eef6ff;
  color: #007dffdb;
}

.list {
  overflow: auto;
}

.row {
  display: flex;
  gap: 10px;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 8px;
}

.thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
}

.rowText {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.rowTitle {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rowSub {
  font-size: 12px;
  color: #999;
}

.row:hover {
  background: #f5f9ff;
}

.previewBox {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #eee;
  overflow: hidden;
  border-radius: 12px;
}

.main {
  min-height: 0;
  display: grid;
  grid-template-rows: 1fr auto;
  padding: 12px;
  gap: 12px;
}

.active {
  border-color: #409eff;
  background: #eef6ff;
}

.footer {
  border-top: 1px solid #eee;
  padding-top: 12px;
  display: grid;
  gap: 10px;
  overflow: auto;
  width: 100%;
  height: 200px;
}


.metaTitle {
  font-size: 16px;
  font-weight: 600;
}

.roomIdBox {
  display: grid;
  gap: 10px;
  grid-template-columns: 50px 1fr 60px;
  margin-top: 10px;
}

.roomIdTitle {
  color: #5dbaff;
  font-weight: 600;
}


.roomId {
  font-size: 12px;
  color: #999;
  height: 22px;
  line-height: 22px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding-left: 10px;
  display: inline-block;
}

.roomIdBtn,
.createRoomBtn {
  /* 基础布局 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0px 16px;

  /* 蓝色底色 + 白色文字 */
  background-color: #1890ff;
  color: #ffffff;

  /* 文字样式 */
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;

  /* 边框与圆角 */
  border: none;
  border-radius: 4px;

  /* 鼠标样式 */
  cursor: pointer;

  /* 过渡动画 */
  transition: all 0.2s ease;

  /* 防止文字选中 */
  user-select: none;
}

/* 悬停效果 - 颜色加深 */
.roomIdBtn:hover,
.createRoomBtn:hover {
  background-color: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.35);
}

/* 点击效果 - 按下状态 */
.roomIdBtn:active,
.createRoomBtn:active {
  background-color: #096dd9;
  transform: translateY(0);
  box-shadow: none;
}


/* 禁用状态 */
.roomIdBtn:disabled,
.roomIdBtn.disabled,
.createRoomBtn.disabled {
  background-color: #bae7ff;
  color: rgba(255, 255, 255, 0.8);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.nameBox {
  display: grid;
  grid-template-columns: 50px 1fr;
  gap: 10px;
  margin-top: 10px;
}

.roomName {
  font-size: 12px;
  color: #333;
  height: 24px;
  line-height: 22px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0 10px;
  width: 546px;
  outline: none;
  background-color: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.roomName:focus {
  border-color: #1890ff;
}

.roomNumberBox {
  display: grid;
  grid-template-columns: 50px 1fr;
  gap: 10px;
  margin-top: 10px;
}

.roomNumber {
  font-size: 12px;
  color: #333;
  height: 24px;
  line-height: 22px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0 10px;
  width: 546px;
  outline: none;
  background-color: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s;
  width: 40px;
  text-align: center;
}

.roomNumber:focus {
  border-color: #1890ff;
}

.action {
  display: grid;
  justify-content: end;
}

.createRoomBtn {
  margin-top: 20px;
  height: 32px;
}
</style>
