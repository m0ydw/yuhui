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

type BoardProjectRecord = BoardProjectMeta & BoardProjectDetail

const DB_NAME = 'yuhui-board'
const DB_VERSION = 1
const STORE_NAME = 'projects'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
  })
  return dbPromise
}

function txStore(
  mode: IDBTransactionMode,
): Promise<{ db: IDBDatabase; store: IDBObjectStore; tx: IDBTransaction }> {
  return openDb().then((db) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    return { db, store, tx }
  })
}

export async function listBoardProjects(): Promise<BoardProjectMeta[]> {
  const { store } = await txStore('readonly')
  const req = store.getAll()
  const records: BoardProjectRecord[] = await new Promise((resolve, reject) => {
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result as BoardProjectRecord[])
  })
  return records
    .map<BoardProjectMeta>((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      previewDataUrl: r.previewDataUrl,
      strokeCount: r.strokeCount,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getBoardProjectDetail(id: string): Promise<BoardProjectDetail | null> {
  if (!id) return null
  const { store } = await txStore('readonly')
  const req = store.get(id)
  const rec = await new Promise<BoardProjectRecord | undefined>((resolve, reject) => {
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result as BoardProjectRecord | undefined)
  })
  if (!rec) return null
  return {
    strokes: rec.strokes,
    boardState: rec.boardState,
  }
}

export async function upsertBoardProject(meta: BoardProjectMeta, detail: BoardProjectDetail) {
  const { store, tx } = await txStore('readwrite')
  const record: BoardProjectRecord = {
    ...meta,
    ...detail,
  }
  const req = store.put(record)
  await new Promise<void>((resolve, reject) => {
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function deleteBoardProject(id: string) {
  const { store, tx } = await txStore('readwrite')
  const req = store.delete(id)
  await new Promise<void>((resolve, reject) => {
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export function generateProjectId() {
  const randomPart =
    typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `p_${randomPart}`
}

