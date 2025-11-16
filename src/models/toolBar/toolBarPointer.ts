import { type Ref } from 'vue'
export function toolBarPointer(
  el: HTMLElement, //移动的按钮
  change: (px: number, py: number, elWidth: number, elHeight: number) => void,
  position: Ref<{ x: number; y: number }>,
) {
  const gap = { x: 0, y: 0 } //差距
  const Down = (e: PointerEvent) => {
    gap.x = e.clientX - position.value.x
    gap.y = e.clientY - position.value.y
    //拦截
    el.setPointerCapture(e.pointerId)
    //挂载
    window.addEventListener('pointermove', Move)
    window.addEventListener('pointerup', Up)
  }

  const Move = (e: PointerEvent) => {
    //传入
    change(e.clientX - gap.x, e.clientY - gap.y, el.offsetWidth, el.offsetHeight)
  }

  const Up = (e: PointerEvent) => {
    el.releasePointerCapture(e.pointerId)
    window.removeEventListener('pointermove', Move)
    window.removeEventListener('pointerup', Up)
  }
  //监听mousedown
  el.addEventListener('pointerdown', Down)
  //清理函数
  return () => {
    el.removeEventListener('pointerdown', Down)
    window.removeEventListener('pointermove', Move)
    window.removeEventListener('pointerup', Up)
  }
}
