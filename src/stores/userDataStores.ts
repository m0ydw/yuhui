import { defineStore } from 'pinia'
import { ref } from 'vue'
import { URLSERVER } from '@/api'
interface userData {
  userName: string
  userAvatar: string
}

const userDataStore = defineStore('userData', () => {
  let mydata = localStorage.getItem('User_Data')

  const myUserData = ref<userData>({
    userName: 'noName',
    userAvatar: URLSERVER + '/uploads/avatar/No-avatar.jpg',
  })
  // 初始化
  if (mydata) {
    let data = JSON.parse(mydata)

    if (data.userName && data.userAvatar) {
      myUserData.value.userAvatar = URLSERVER + data.userAvatar + '?t=' + Date.now()
      //带时间戳强制刷新
      myUserData.value.userName = data.userName
    }
  }
  //更新和初始化都带时间戳强制刷新
  function setMyUserData(userData: userData) {
    //传入sql数据即可
    myUserData.value.userAvatar = URLSERVER + userData.userAvatar + '?t=' + Date.now()
    //带时间戳强制刷新
    myUserData.value.userName = userData.userName
  }
  function changeMyName(userName: string) {
    myUserData.value.userName = userName
  }
  function changeMyAvatar(userAvatar: string) {
    myUserData.value.userAvatar = URLSERVER + userAvatar + '?t=' + Date.now()
  }
  function getMyUserData() {
    return myUserData
  }

  //其他人的url
  const userMap = ref<Map<string, userData>>(new Map())
  //存储其他用户
  function setUserData(userId: string, userData: userData) {
    // 构造带完整路径的头像
    const fullAvatar = URLSERVER + userData.userAvatar + '?t=' + Date.now()

    userMap.value.set(userId, {
      userName: userData.userName,
      userAvatar: fullAvatar, // 存完整路径
    })

    // 保存到本地
  }
  //获得
  function getUserData(userId: string): userData | undefined {
    return userMap.value.get(userId)
  }
  //
  function setUSERS(arr: { userkey: string; avatar: string; name: string }[]) {
    arr.forEach((item, index) => {
      setUserData(item.userkey, { userName: item.name, userAvatar: item.avatar })
    })
  }
  return {
    getMyUserData,
    setMyUserData,
    changeMyName,
    changeMyAvatar,
    setUserData,
    getUserData,
    setUSERS,
  }
})
export default userDataStore
