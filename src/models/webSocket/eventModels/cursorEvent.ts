import { getUserId } from '../cilentExample'

export function sendIAmMove(x: number, y: number) {
  return JSON.stringify({
    type: 'IAmMove',
    data: {
      x,
      y,
      userId: getUserId(),
    },
  })
}
