import type { Stroke } from '@/models/types'

export type BoardViewState = { panX: number; panY: number; zoom: number }

export type BoardProjectMeta = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  previewDataUrl: string
  strokeCount: number
}

export type BoardProjectDetail = {
  strokes: Stroke[]
  boardState: BoardViewState
}

const PROJECTS_INDEX_KEY = 'yuhui_board_projects'
const PROJECT_DETAIL_KEY_PREFIX = 'yuhui_board_project_'

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function cloneJson<T>(obj: T): T {
  // localStorage 只能存 JSON，这里直接走 JSON clone（避免 structuredClone 兼容问题）
  return JSON.parse(JSON.stringify(obj)) as T
}

export function listBoardProjects(): BoardProjectMeta[] {
  const data = safeJsonParse<{ list: BoardProjectMeta[] }>(localStorage.getItem(PROJECTS_INDEX_KEY))
  return (data?.list || []).slice().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getBoardProjectDetail(id: string): BoardProjectDetail | null {
  if (!id) return null
  return safeJsonParse<BoardProjectDetail>(localStorage.getItem(PROJECT_DETAIL_KEY_PREFIX + id))
}

export function upsertBoardProject(meta: BoardProjectMeta, detail: BoardProjectDetail) {
  const list = listBoardProjects()
  const idx = list.findIndex((p) => p.id === meta.id)
  const normalizedMeta = cloneJson(meta)
  const normalizedDetail = cloneJson(detail)

  if (idx >= 0) {
    list[idx] = normalizedMeta
  } else {
    list.unshift(normalizedMeta)
  }

  localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify({ list }))
  localStorage.setItem(PROJECT_DETAIL_KEY_PREFIX + meta.id, JSON.stringify(normalizedDetail))
}

export function deleteBoardProject(id: string) {
  const list = listBoardProjects().filter((p) => p.id !== id)
  localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify({ list }))
  localStorage.removeItem(PROJECT_DETAIL_KEY_PREFIX + id)
}

export function generateProjectId() {
  const randomPart =
    typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `p_${randomPart}`
}

