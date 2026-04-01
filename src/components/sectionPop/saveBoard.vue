<template>
  <div class="popRoot">
    <div class="header">
      <div class="title">保存</div>
      <button class="ghost" @click="handleClose">关闭</button>
    </div>

    <div class="body">
      <div class="side">
        <div class="sideTitle">工程</div>
        <div class="list">
          <div class="row" :class="{ active: selectedId === 'new' }" @click="selectNew">
            <div class="rowTitle">+ 新建</div>
            <div class="rowSub">保存当前画布为新工程</div>
          </div>

          <div v-for="p in projects" :key="p.id" class="row" :class="{ active: selectedId === p.id }"
            @click="selectExisting(p.id)">
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
          <img v-if="previewUrl" class="preview" :src="previewUrl" alt="预览图" />
          <div v-else class="previewLoading">生成预览中...</div>
        </div>

        <div class="form">
          <label class="field">
            <div class="label">名称</div>
            <input class="input" v-model="name" placeholder="例如：我的草稿" />
          </label>

          <label class="field">
            <div class="label">时间</div>
            <div class="readonly-time">{{ formatTime(displayTime) }}</div>
          </label>

          <div class="actions">
            <button class="primary" :disabled="busy || !canSave" @click="save">
              {{ selectedId === 'new' ? '保存为新工程' : '覆盖保存' }}
            </button>
            <button v-if="selectedId !== 'new'" class="danger" :disabled="busy" @click="remove">
              删除工程
            </button>
          </div>

          <div v-if="message" class="msg">{{ message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Board } from '@/models'
import type { BoardProjectMeta } from '@/utils/boardProjectStorage'
import { boardDataToImage, generateProjectId, listBoardProjects, upsertBoardProject, deleteBoardProject } from '@/utils'
import { getPopFlex } from '@/models/flexpop/flexpop'
import router from '@/router'

const props = withDefaults(defineProps<{ boardData: Board, code: number }>(), { code: 0 })
const emit = defineEmits<{ close: [] }>()

const projects = ref<BoardProjectMeta[]>([])
const selectedId = ref<'new' | string>('new')

const previewUrl = ref('')
const name = ref('')
const displayTime = ref<number>(Date.now())
const busy = ref(false)
const message = ref('')

const canSave = computed(() => name.value.trim().length > 0 && previewUrl.value.length > 0)

function handleClose() {
  if (props.code === 0) {
    emit('close')
    return
  } else {
    const pop = getPopFlex()
    pop?.value.setCanClose(true)
    router.push({ name: 'allRoom' })
    emit('close')
  }
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}

async function refreshProjects() {
  projects.value = await listBoardProjects()
}

function selectNew() {
  selectedId.value = 'new'
  name.value = `未命名 ${new Date().toLocaleDateString()}`
  displayTime.value = Date.now()
  message.value = ''
}

function selectExisting(id: string) {
  const meta = projects.value.find((p) => p.id === id)
  if (!meta) return
  selectedId.value = id
  name.value = meta.name
  displayTime.value = meta.updatedAt || Date.now()
  message.value = ''
}

async function buildPreview() {
  const strokes = props.boardData.getAllStrokes()
  if (!strokes.length) {
    previewUrl.value = ''
    return
  }
  previewUrl.value = await boardDataToImage(strokes, {
    bgColor: '#ffffff',
    targetSide: 512,
  })
}

async function save() {
  if (!canSave.value) return
  busy.value = true
  message.value = ''
  try {
    const strokes = props.boardData.getAllStrokes()
    const now = Date.now()

    if (selectedId.value === 'new') {
      const id = generateProjectId()
      upsertBoardProject(
        {
          id,
          name: name.value.trim(),
          createdAt: now,
          updatedAt: now,
          previewDataUrl: previewUrl.value,
          strokeCount: strokes.length,
        },
        { strokes, boardState: props.boardData.getState() },
      )
      selectedId.value = id
      refreshProjects()
      message.value = '已保存为新工程'
    } else {
      const id = selectedId.value
      const old = projects.value.find((p) => p.id === id)
      upsertBoardProject(
        {
          id,
          name: name.value.trim(),
          createdAt: old?.createdAt || now,
          updatedAt: now,
          previewDataUrl: previewUrl.value,
          strokeCount: strokes.length,
        },
        { strokes, boardState: props.boardData.getState() },
      )
      refreshProjects()
      message.value = '已覆盖保存'
    }
  } finally {
    busy.value = false
  }
}

function remove() {
  if (selectedId.value === 'new') return
  deleteBoardProject(selectedId.value)
  refreshProjects()
  selectNew()
  message.value = '已删除'
}

onMounted(async () => {
  await refreshProjects()
  selectNew()
  await buildPreview()
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

.readonly-time {
  height: 36px;
  border-radius: 10px;
  border: 1px solid #ddd;
  padding: 0 10px;
  display: flex;
  align-items: center;
  color: #333;
  background: #f9fafb;
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

.form {
  border-top: 1px solid #eee;
  padding-top: 12px;
  display: grid;
  gap: 10px;
}

.field {
  display: grid;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: #666;
}

.input {
  height: 36px;
  border-radius: 10px;
  border: 1px solid #ddd;
  padding: 0 10px;
  outline: none;
}

.input:focus {
  border-color: #409eff;
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

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
