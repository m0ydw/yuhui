//放抖动
export function throttle<T extends (...args: any[]) => void>(func: T, waitTime: number) {
  let lastTime = 0
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= waitTime) {
      lastTime = now
      func.apply(this, args)
    }
  }
}
