import { myWebsocketClient } from '../cilentExample'
import { type Board } from '@/models/types'
import { sendIAmMove } from '../eventModels/cursorEvent'
interface position {
  x: number
  y: number
  name: string
  id: string
  color: string
  nameWidth: number //自己计算
  nameHeight: number //自己计算
  visibleName: string //自己计算
}
let boardData: Board | null = null
let CursorCtx: CanvasRenderingContext2D | null = null
// let otherCursorCanvas: HTMLCanvasElement | null = null

const NameMap = new Map<'string', position>()
//绘制节流
let Fps = 10 //多少ms执行一次
let last = 0
// 名字绘制时的数据
let size: number = 20
let fontSize: number = 12
let fontFamily = '"Arial Rounded MT Bold"'
let maxWidth = 200
let borderRadius = 4
const padding = {
  x: 6, // 水平内边距
  y: 4, // 垂直内边距
}
export function inItCursorMap() {}
// 工具函数
// 切字符串到指定大小(maxWidth)
function cutText(ctx: CanvasRenderingContext2D, text: string): { realName: string; width: number } {
  if (!CursorCtx) return { realName: '', width: 0 }
  CursorCtx.save()
  CursorCtx.font = `${fontSize}px  ${fontFamily}`
  const willAdd = '...'
  const addWidth = CursorCtx.measureText(willAdd).width
  let width = 0
  let res = ''

  for (const char of text) {
    const charWidth = CursorCtx.measureText(char).width
    if (width + charWidth + addWidth > maxWidth) {
      // 大于长度时直接退出
      break
    }
    // 否则加入
    width += charWidth
    res += char
  }
  CursorCtx.restore()

  // 最终返回结果
  return { realName: res + willAdd, width }
}
/*             被用于添加监听的函数                             */
// 添加用户
function addUser(data: any) {
  if (!CursorCtx || !boardData) return

  CursorCtx!.save()
  const aim = data.data.hisCursor
  // user 是id
  // 测量长度以及可视名
  CursorCtx!.font = `${fontSize}px ${fontFamily}`
  let width = CursorCtx!.measureText(aim.name).width
  let name = aim.name
  if (width > maxWidth) {
    let res = cutText(CursorCtx!, aim.name)
    name = res.realName
    width = res.width
  }
  let height =
    CursorCtx!.measureText(name).actualBoundingBoxAscent +
    CursorCtx!.measureText(name).actualBoundingBoxDescent
  NameMap.set(aim.id, {
    x: aim.x,
    y: aim.y,
    name: aim.name,
    id: aim.id,
    color: aim.color,
    nameWidth: width,
    nameHeight: height,
    visibleName: name,
  })
  // 渲染
  console.log(NameMap.values())
  renderOtherCursor()
  CursorCtx!.restore()
}
//初始化添加
export function addUsers(otherCursors: any[]) {
  if (!CursorCtx || !boardData) return

  for (const value of otherCursors) {
    CursorCtx!.save()
    // 测量长度以及可视名
    CursorCtx!.font = `${fontSize}px ${fontFamily}`
    let width = CursorCtx!.measureText(value.name).width
    let name = value.name
    if (width > maxWidth) {
      let res = cutText(CursorCtx!, value.name)
      name = res.realName
      width = res.width
    }
    let height =
      CursorCtx!.measureText(name).actualBoundingBoxAscent +
      CursorCtx!.measureText(name).actualBoundingBoxDescent
    NameMap.set(value.id, {
      x: value.x,
      y: value.y,
      name: value.name,
      id: value.id,
      color: value.color,
      nameWidth: width,
      nameHeight: height,
      visibleName: name,
    })
    CursorCtx!.restore()
  }
  //最终渲染
  renderOtherCursor()
}
// 删除用户
function delUser(data: any) {
  if (!CursorCtx || !boardData) return
  const aim = data.data
  NameMap.delete(aim.user)
  // 渲染
  renderOtherCursor()
}
// 用户移动
function userMove(data: any) {
  if (!CursorCtx || !boardData) return
  const aim = data.data

  const change = NameMap.get(aim.userId)
  if (change) {
    change.x = aim.x
    change.y = aim.y
  }
  // 渲染
  renderOtherCursor()
}
// 添加此类事件监听
export function addCursorEvent(board: Board, ctx: CanvasRenderingContext2D) {
  // 初始化
  boardData = board
  CursorCtx = ctx
  // 添加用户

  myWebsocketClient.on('whoJoins', addUser)
  // 删除用户
  myWebsocketClient.on('whoExit', delUser)
  // 被踢出用户：不触发 whoExit，所以这里手动删除光标
  myWebsocketClient.on('userKicked', delUser)
  // 用户移动
  myWebsocketClient.on('someoneMove', userMove)
}
// 移除此类事件监听
export function delCursorEvent() {
  myWebsocketClient.off('whoJoins', addUser)
  myWebsocketClient.off('whoExit', delUser)
  myWebsocketClient.off('userKicked', delUser)
  myWebsocketClient.off('someoneMove', userMove)
}
// 渲染所有人的位置（参数为true强制渲染）
//卸载此功能时将CursorCtx boardData =null
//在hand.ts处还会调用  防止视图偏移
export function renderOtherCursor(timeJudge: boolean = false) {
  if (!CursorCtx || !boardData) return

  let now = Date.now()
  //进行判断
  if (!timeJudge && now - last < Fps) return
  last = now
  const cornerRadius = 2

  // 清空
  const dpr = window.devicePixelRatio || 1

  CursorCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  CursorCtx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  CursorCtx.save()
  const zoom = boardData.getZoom()
  // 移动ctx坐标系位置并缩放(保证坐标正确)
  CursorCtx.translate(boardData.getPanx(), boardData.getPany())
  CursorCtx.scale(zoom, zoom)
  // 获取相对大小
  const realSize = size / zoom
  const realCornerRadius = cornerRadius / zoom
  const realBorderRadius = borderRadius / zoom
  const realPadding = {
    x: padding.x / zoom,
    y: padding.y / zoom,
  }
  const realFontSize = fontSize / zoom
  // 遍历map绘制

  for (const value of NameMap.values()) {
    //越过未移动的用户
    if (!value.x || !value.y) continue
    //定义所有点
    const p0 = { x: value.x, y: value.y }
    const p1 = { x: value.x, y: value.y + realSize }
    const p2 = { x: value.x + realSize * 0.3, y: value.y + realSize * 0.6 }
    const p3 = { x: value.x + realSize * 0.8, y: value.y + realSize * 0.6 }

    // 绘制箭头
    CursorCtx!.save()
    CursorCtx!.shadowBlur = 3
    CursorCtx!.shadowColor = 'rgba(0, 0, 0, 0.5)'
    CursorCtx!.fillStyle = value.color
    CursorCtx!.beginPath()
    CursorCtx!.moveTo(p0.x, p0.y)
    // 绘制箭头
    CursorCtx!.arcTo(p1.x, p1.y, p2.x, p2.y, realCornerRadius)
    CursorCtx!.arcTo(p2.x, p2.y, p3.x, p3.y, realCornerRadius)
    CursorCtx!.arcTo(p3.x, p3.y, p0.x, p0.y, realCornerRadius)
    CursorCtx!.closePath()
    CursorCtx!.fill()
    // 绘制名字背景
    CursorCtx!.font = `${realFontSize}px ${fontFamily}`
    CursorCtx!.fillStyle = value.color //背景颜色
    //缩放后的尺寸
    const nameWidth = value.nameWidth / zoom
    const nameHeight = value.nameHeight / zoom
    //位置
    const rectX = value.x + realSize
    const rectY = value.y + realSize * 0.5
    fillRoundedRect(
      CursorCtx!,
      rectX - realPadding.x,
      rectY - realPadding.y,
      nameWidth + realPadding.x * 2,
      nameHeight + realPadding.y * 2,
      realBorderRadius,
    )
    //绘制文字

    CursorCtx!.fillStyle = '#ffffff'
    CursorCtx!.textBaseline = 'top'
    CursorCtx!.fillText(
      value.visibleName,
      rectX, // x: 文字从原始矩形左侧开始
      rectY, // y: 文字从原始矩形顶部开始
    )
  }

  CursorCtx.restore()
}
//工具 绘制带圆角的矩形
function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  // 如果半径大于宽度或高度的一半，将其限制为较小的值，防止形状错误
  if (width < 2 * radius) radius = width / 2
  if (height < 2 * radius) radius = height / 2

  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius) // 右上角
  ctx.arcTo(x + width, y + height, x, y + height, radius) // 右下角
  ctx.arcTo(x, y + height, x, y, radius) // 左下角
  ctx.arcTo(x, y, x + width, y, radius) // 左上角
  ctx.closePath()
  ctx.fill()
}
//发送自己移动消息

let lastDate = 0
let stop = false
export function cursorMoveSend(board: Board, e: PointerEvent) {
  if (stop) return
  let now = Date.now()
  if (now - lastDate < 16) {
    return
  }
  //否则发送
  let { offsetX, offsetY } = e
  let x = board.toWorldX(offsetX)
  let y = board.toWorldY(offsetY)
  myWebsocketClient.send(sendIAmMove(x, y))
}
//也在hand.ts中调用  防止抖动
export function changeCursorStop(change: boolean) {
  stop = change
}
