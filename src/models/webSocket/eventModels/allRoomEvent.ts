export function sendGetAllRoom() {
  console.log(1)
  return JSON.stringify({
    type: 'getAllRoom',
    data: {},
  })
}
