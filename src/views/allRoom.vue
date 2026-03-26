<template>
  <!--
    1. 将 div 改为 TransitionGroup
    2. tag="div" 表示渲染成一个 div 标签
    3. name="list" 对应下方 CSS 的类名前缀
  -->
  <allRoomNav></allRoomNav>
  <TransitionGroup name="list" tag="div" class="container">
    <oneRoom v-for="value in roomMap.getValues()" :key="value.roomId" :roomData="value" :timeMap="timeMap"></oneRoom>
  </TransitionGroup>
  <!-- 当为空时 -->
  <div v-if="roomMap.getValues().length === 0" key="empty-tip" class="empty-state">
    <div class="empty-icon"></div>
    <p>当前暂无房间</p>
    <p class="sub-text">你可以点击右上角新建一个哦~</p>
  </div>
</template>

<script setup lang="ts">
import {
  myWebsocketClient,
  sendGetAllRoom,
  createAllRoomMap,
  addAllRoomEvent,
  changeUserId,
  type roomState
} from '@/models';
import oneRoom from '@/components/oneRoom.vue';
import allRoomNav from '@/components/allRoomNav.vue';
import { ref, onMounted, reactive } from 'vue';

const roomMap = createAllRoomMap()
const timeMap = reactive(new Map<string, { on: boolean, count: number }>())
import { request, type logFinalData, URLSERVER } from '@/api';
import userDataStore from '@/stores/userDataStores';
let userdata = userDataStore()
onMounted(async () => {
  myWebsocketClient.disconnect()
  changeUserId(await myWebsocketClient.connect('allRoom'))
  //发送初始化请求
  myWebsocketClient.send(sendGetAllRoom())
  //接收等待
  const Res = await myWebsocketClient.waitForMessage('allRoom')
  //初始化
  roomMap.roomInIt(Res.data)
  //监听
  addAllRoomEvent(roomMap, timeMap)

  //获取用户的名称和
  const res = await request<logFinalData>('api/auth/tokenLogin', 'GET', {}, false)
  console.log(res)
  let userData = { userName: res.data.name, userAvatar: res.data.avatar }
  localStorage.setItem('User_Data', JSON.stringify(userData))
  localStorage.setItem('createAt', res.data.createAt)
  //更新
  userdata.setMyUserData(userData)
})
</script>

<style scoped>
.empty-state {
  width: 100%;
  /* 独占一行 */
  height: 300px;
  /* 给点高度让它垂直居中看起来舒服 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  /*
     重要：因为外层 TransitionGroup 的 .list-leave-active 用了 absolute
     这里最好相对定位，确保它出现时占据空间
  */
  position: relative;
  pointer-events: none;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.empty-state .sub-text {
  font-size: 13px;
  color: #c0c4cc;
  margin-top: 5px;
}

/* 容器样式，给一点内边距，防止动画溢出被截断 */
.container {
  padding: 10px;
  /* 如果希望房间多了之后能自动换行整齐排列，可以加上 flex */
  /* display: flex; */
  /* flex-wrap: wrap; */
}

/* --- 动画核心 CSS --- */

/* 1. 移动中的动画 (Move)
   当列表顺序改变，或者有元素被删除导致其他元素需要移动位置时触发
*/
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

/* 2. 进场 (Enter) 和 离场 (Leave) 的状态 */
/* 进场前 和 离场后：透明且稍微向下偏移（产生上浮效果） */
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  /* 加上 scale 让消失更自然 */
}

/* 3. 关键点：确保删除时，其他元素能平滑补位 */
/* 当元素正在“离开”时，将其脱离文档流，这样后面的元素就能识别到空位并飘过来 */
.list-leave-active {
  position: absolute;
  /* 注意：使用 absolute 时，请确保 oneRoom 组件有固定的宽或合适的间距，否则可能会重叠 */
}
</style>
