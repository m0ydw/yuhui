<template>
  <div class="popRoot">
    <div class="header">
      <div class="title">读取</div>
      <button class="ghost" @click="emit('close')">关闭</button>
    </div>

    <div class="body">
      <div class="side">
        <div class="sideTitle">工程</div>
        <div class="list">
          <div v-for="p in projects" :key="p.id" class="row" :class="{ active: selectedId === p.id }"
            @click="select(p.id)">
            <img v-if="p.previewDataUrl" class="thumb" :src="p.previewDataUrl" alt="preview" />
            <div class="rowText">
              <div class="rowTitle">{{ p.name }}</div>
              <div class="rowSub">{{ formatTime(p.updatedAt) }} · {{ p.strokeCount }} 笔</div>
            </div>
          </div>
          <div v-if="projects.length === 0" class="empty">暂无保存的工程</div>
        </div>
      </div>

      <div class="main">
        <div class="previewBox">
          <img v-if="selected?.previewDataUrl" class="preview" :src="selected.previewDataUrl" alt="预览图" />
          <div v-else class="previewLoading">请选择一个工程</div>
        </div>

        <div class="footer">
          <div class="meta" v-if="selected">
            <div class="metaTitle">{{ selected.name }}</div>
            <div class="metaSub">创建：{{ formatTime(selected.createdAt) }}</div>
            <div class="metaSub">修改：{{ formatTime(selected.updatedAt) }}</div>
          </div>
          <div class="actions">
            <button class="primary" :disabled="busy || !selectedId" @click="load">加载</button>
            <button class="danger" :disabled="busy || !selectedId" @click="remove">删除</button>
          </div>
          <div v-if="message" class="msg">{{ message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Board, strokeFlow } from '@/models'
import type { BoardProjectMeta } from '@/utils/boardProjectStorage'
import { getBoardProjectDetail, listBoardProjects, deleteBoardProject } from '@/utils'

const props = defineProps<{
  boardData: Board
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  userQueue: strokeFlow
}>()
const emit = defineEmits<{ close: [] }>()

const projects = ref<BoardProjectMeta[]>([])
const selectedId = ref<string>('')
const busy = ref(false)
const message = ref('')

const selected = computed(() => projects.value.find((p) => p.id === selectedId.value))

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}

async function refresh() {
  projects.value = await listBoardProjects()
  if (projects.value.length && !selectedId.value) {
    selectedId.value = projects.value[0]!.id
  }
  if (selectedId.value && !projects.value.some((p) => p.id === selectedId.value)) {
    selectedId.value = projects.value[0]?.id || ''
  }
}

function select(id: string) {
  selectedId.value = id
  message.value = ''
}

async function load() {
  if (!selectedId.value) return
  busy.value = true
  message.value = ''
  try {
    const detail = await getBoardProjectDetail(selectedId.value)
    if (!detail) {
      message.value = '读取失败：工程内容不存在'
      return
    }

    // 清空当前画布（仅本地，不发联机）
    props.userQueue.clearAll()
    props.boardData.clearAll(props.ctx, props.canvas)

    // 恢复 strokes 与视角
    props.boardData.addStrokes(detail.strokes || [])
    props.boardData.setState(detail.boardState || { panX: 0, panY: 0, zoom: 1 }, props.ctx, props.canvas)

    emit('close')
  } finally {
    busy.value = false
  }
}

function remove() {
  if (!selectedId.value) return
  deleteBoardProject(selectedId.value)
  refresh()
  message.value = '已删除'
}

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.popRoot {
  width: min(980px, 92vw);
  height: min(620px, 86vh);
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(180deg, #ffffff, #fafafa);
}

.title {
  font-weight: 600;
  letter-spacing: 0.2px;
}

.ghost {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666;
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

.list {
  overflow: auto;
  padding-right: 6px;
}

.row {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 8px;
}

.row:hover {
  background: #f5f9ff;
}

.row.active {
  border-color: #409eff;
  background: #eef6ff;
}

.thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #eee;
  background: #fafafa;
}

.rowText {
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  color: #666;
  margin-top: 2px;
}

.empty {
  color: #666;
  font-size: 13px;
  padding: 10px;
}

.main {
  padding: 12px;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 12px;
  min-height: 0;
}

.previewBox {
  border: 1px solid #eee;
  border-radius: 12px;
  background: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.previewLoading {
  color: #666;
}

.footer {
  border-top: 1px solid #eee;
  padding-top: 12px;
  display: grid;
  gap: 10px;
}

.metaTitle {
  font-weight: 700;
}

.metaSub {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: 10px;
}

.primary {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: #409eff;
  color: #fff;
}

.danger {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #f56c6c;
  cursor: pointer;
  background: #fff;
  color: #f56c6c;
}

.msg {
  font-size: 12px;
  color: #2e7d32;
}
</style>

