<template>
  <div class="chat-root" v-if="visible">
    <div class="chat-panel" @mouseenter="hovering = true" @mouseleave="hovering = false">
      <header class="chat-header">
        <div class="chat-title">房间聊天</div>
        <button class="chat-close" @click="close">×</button>
      </header>

      <div class="chat-body" ref="listRef" @scroll="onScroll">
        <div class="spacer" :style="{ height: topPadding + 'px' }"></div>
        <!-- 消息部分 -->
        <div v-for="msg in visibleMessages" :key="msg.id" class="chat-item" :class="{ 'is-me': isme(msg.userId) }"
          @mouseenter="hoverMsgId = msg.id" @mouseleave="hoverMsgId = ''">
          <!-- 头像 -->
          <div class="avatar" :style="isme(msg.userId) ? {
            backgroundImage: `url(${mydata.userAvatar})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : {
            backgroundImage: `url(${dataStore.getUserData(msg.userId)?.userAvatar || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }"></div>
          <div class="content">
            <div class="meta">
              <span class="user">{{ msg.name }}</span>
              <span class="time" v-if="hoverMsgId === msg.id">
                {{ formatTime(msg.createdAt) }}
              </span>
            </div>
            <div class="text">{{ msg.text }}</div>
          </div>
        </div>
        <!-- 消息部分 -->
        <div class="spacer" :style="{ height: bottomPadding + 'px' }"></div>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="!hasMore && messages.length === 0" class="empty">暂无消息</div>
      </div>

      <footer class="chat-footer">
        <textarea class="chat-input" v-model="draft" maxlength="100" placeholder="最大100 字"
          @keydown.enter.prevent="send"></textarea>
        <button class="chat-send" :disabled="!canSend" @click="send">发送</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getUserId, myWebsocketClient } from '@/models/webSocket/cilentExample'
//单个消息的信息
interface ChatMessage {
  id: string
  userId: string
  text: string
  createdAt: number
  name: string
}

const props = defineProps<{
  roomId: string
  modelValue: boolean
}>()
//传递事件  关闭组件
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
import userDataStore from '@/stores/userDataStores'
const dataStore = userDataStore()
const mydata = dataStore.getMyUserData()

const visible = computed(() => props.modelValue)
const messages = ref<ChatMessage[]>([])
const hasMore = ref(true)
const cursor = ref<number | null>(null)
const loading = ref(false)     //防止重复加载
const draft = ref('')
const hoverMsgId = ref('')
const hovering = ref(false)
const isme = (id: string) => id === getUserId()  //是否是自己发的消息

// 虚拟列表
const ITEM_HEIGHT = 44     //单位高度
const OVERSCAN = 6
const listRef = ref<HTMLDivElement | null>(null)
const scrollTop = ref(0)
//总高度
const totalHeight = computed(() => messages.value.length * ITEM_HEIGHT)
//(可视)开始的序号
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - OVERSCAN))
//结束的序号
const endIndex = computed(() =>
  Math.min(messages.value.length, Math.floor((scrollTop.value + viewportHeight.value) / ITEM_HEIGHT) + OVERSCAN),
)
//可视的消息数组
const visibleMessages = computed(() => messages.value.slice(startIndex.value, endIndex.value))
//顶部消息长度占位高度
const topPadding = computed(() => startIndex.value * ITEM_HEIGHT)
//底部消息长度占位高度
const bottomPadding = computed(() => totalHeight.value - topPadding.value - visibleMessages.value.length * ITEM_HEIGHT)
//可视部分高度
const viewportHeight = computed(() => (listRef.value ? listRef.value.clientHeight : 0))
//消息发送的判断
const canSend = computed(() => draft.value.trim().length > 0 && draft.value.length <= 100)
//根据时间戳返回时间
function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}
//滚动事件，更新 scrollTop，并在接近顶部时加载更多
function onScroll() {
  if (!listRef.value) return
  scrollTop.value = listRef.value.scrollTop
  if (scrollTop.value < 40 && hasMore.value && !loading.value) {
    loadMore()
  }
}

function close() {
  emit('update:modelValue', false)
}

async function ensureWs() {
  // 保证 WebSocket 已连接
  if (!myWebsocketClient.ws || myWebsocketClient.ws.readyState !== WebSocket.OPEN) {
    await myWebsocketClient.connect('draw')
  }
}
//历史消息处理函数
function handleChatHistory(raw: any) {
  const data = raw.data
  if (!data || data.roomId !== props.roomId) return
  //是数组
  const items: ChatMessage[] = Array.isArray(data.items) ? data.items : []
  //新消息在前，旧消息在后
  const prevLength = messages.value.length
  if (prevLength === 0) {
    messages.value = items
  } else {
    messages.value = [...items, ...messages.value]
  }
  //是否有更多
  hasMore.value = Boolean(data.hasMore)
  //更新 cursor（用来定位历史消息）
  cursor.value = data.cursor ?? null
  loading.value = false
}

function handleChatMessage(raw: any) {
  const data = raw.data
  if (!data || data.roomId !== props.roomId || !data.msg) return
  const msg = data.msg as ChatMessage
  const exists = messages.value.find((m) => m.id === msg.id)
  if (exists) {
    Object.assign(exists, msg)
  } else {
    messages.value = [...messages.value, msg]
  }
}

async function joinChat() {
  if (!props.roomId) return
  loading.value = true
  await ensureWs()
  myWebsocketClient.send(
    JSON.stringify({
      type: 'chatJoin',
      data: {
        roomId: props.roomId,
        limit: 10,
      },
    }),
  )
}
//加载更多
function loadMore() {
  if (!props.roomId || !hasMore.value || loading.value) return
  loading.value = true
  myWebsocketClient.send(
    JSON.stringify({
      type: 'chatHistoryRequest',
      data: {
        roomId: props.roomId,
        limit: 10,
        cursor: cursor.value,
      },
    }),
  )
}
//发送消息
function send() {
  if (!canSend.value || !props.roomId) return
  const text = draft.value.trim().slice(0, 100)
  if (!text) return
  myWebsocketClient.send(
    JSON.stringify({
      type: 'chatSend',
      data: {
        roomId: props.roomId,
        text,
      },
    }),
  )
  draft.value = ''
}

onMounted(() => {
  // 监听聊天消息
  myWebsocketClient.on('chatHistory', handleChatHistory)   //历史消息
  myWebsocketClient.on('chatMessage', handleChatMessage)    //新消息
})

onBeforeUnmount(() => {
  myWebsocketClient.off('chatHistory', handleChatHistory)
  myWebsocketClient.off('chatMessage', handleChatMessage)
})

watch(
  () => visible.value,
  (v) => {
    if (v) {
      messages.value = []
      hasMore.value = true
      cursor.value = null
      joinChat()
    }
  },
  { immediate: false },
)
</script>

<style scoped>
.chat-root {
  position: fixed;
  right: 16px;
  bottom: 80px;
  z-index: 50;
}

.chat-panel {
  width: 320px;
  height: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(180deg, #ffffff, #fafafa);
}

.chat-title {
  font-size: 14px;
  font-weight: 600;
}

.chat-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #999;
}

.chat-body {
  flex: 1;
  position: relative;
  overflow-y: auto;
  padding: 4px 0;
}

.spacer {
  width: 100%;
}

.chat-item {
  display: flex;
  padding: 4px 10px;
  gap: 8px;
}

.chat-item.is-me {
  flex-direction: row-reverse;
  /* 头像跑到右边 */
  text-align: right;
  /* 文字右对齐 */
}

.is-me .content {
  align-items: flex-end;
  /* 内容右对齐 */
}

.is-me .meta {
  flex-direction: row-reverse;
  /* 名字和时间顺序也反一下*/
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-width: 0;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #999;
}

.user {
  font-weight: 600;
  color: #555;
}

.time {
  margin-left: 8px;
}

.text {
  font-size: 13px;
  color: #333;
  margin-top: 2px;
  word-break: break-all;
}

.loading,
.empty {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 6px 0;
}

.chat-footer {
  border-top: 1px solid #eee;
  padding: 6px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
}

.chat-input {
  resize: none;
  border-radius: 8px;
  border: 1px solid #ddd;
  padding: 6px;
  font-size: 13px;
  min-height: 38px;
  max-height: 60px;
}

.chat-send {
  width: 64px;
  border-radius: 8px;
  border: none;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}

.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
