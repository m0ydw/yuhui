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
//核心数据,笔画和画布状态
export type BoardProjectDetail = {
  strokes: Stroke[]
  boardState: BoardViewState
}

//数据库中存储的完整记录类型,包含元信息和详细数据
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
        //建库的时候创建一个object store,以id为主键,并且建立一个updatedAt的索引,方便后续查询和排序
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    //返回数据库实例
  })
  return dbPromise
}

function txStore(
  mode: IDBTransactionMode,
): Promise<{ db: IDBDatabase; store: IDBObjectStore; tx: IDBTransaction }> {
  return openDb().then((db) => {
    //根据传入的事务模式创建一个事务,并获取对应的object store,最后返回数据库实例,store和事务对象
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    return { db, store, tx }
  })
}
//获取列表展示的信息
export async function listBoardProjects(): Promise<BoardProjectMeta[]> {
  const { store } = await txStore('readonly')
  //获取store中所有记录的对象
  const req = store.getAll()
  const records: BoardProjectRecord[] = await new Promise((resolve, reject) => {
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result as BoardProjectRecord[]) //获取到的记录是完整的BoardProjectRecord类型,包含元信息和详细数据
  })
  //将完整记录映射为只包含元信息的BoardProjectMeta类型,并根据updatedAt字段降序排序后返回
  //（用于列表展示）
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
//获取用于加载工程的详细数据,包含笔画和画布状态,如果id不存在则返回null
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
    strokes: rec.strokes, //所有笔画
    boardState: rec.boardState, //离开时的状态
  }
}
//更新或插入一个工程记录,如果id已存在则更新,否则插入新记录,需要传入完整的元信息和详细数据
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
//根据id删除一个工程记录,如果id不存在则不做任何操作
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
//工程id生成
export function generateProjectId() {
  const randomPart =
    typeof crypto !== 'undefined' && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `p_${randomPart}`
}
