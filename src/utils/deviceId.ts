// 1. 提前获取（在 App.vue 或 main.ts 里）
import FingerprintJS from '@fingerprintjs/fingerprintjs'

let deviceId = ''

// 提前加载
;(async () => {
  const fp = await FingerprintJS.load()
  const res = await fp.get()
  deviceId = res.visitorId // 缓存起来
  console.log('设备ID：', deviceId)
})()

// 2. 导出同步方法
export function getDeviceIdSync() {
  return deviceId // 同步返回！
}
