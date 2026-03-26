<template>
  <nav class="navbar">
    <div class="logo">
      <span class="icon"></span>
      <span class="text">绘图大厅</span>
      <div class="clientNum">在线人数:<Transition name="num-pop" mode="out-in">
          <span :key="peopleNum" class="num-value">
            {{ peopleNum }}
          </span>
        </Transition>
      </div>
    </div>

    <div class="actions">

      <div class="search-group">
        <input type="text" v-model="inputRoomId" placeholder="输入房间ID..." class="search-input"
          @keyup.enter="handleEnterRoom" />
        <button class="icon-btn" @click="handleEnterRoom" title="进入房间">
          ➔
        </button>
      </div>

      <div class="divider"></div>

      <button class="nav-btn secondary" @click="handleOffline">
        离线模式
      </button>

      <button class="nav-btn primary" @click="handleCreateRoom">
        + 新建房间
      </button>

      <button class="nav-btn danger" @click="handleLogout">
        退出
      </button>
    </div>

    <div class="user">
      <div class="avatar-cotain" @click="handleInfo">
        <div class="avatar" :style="{
          backgroundImage: `url(${mydata.userAvatar})`, backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }"></div>
        <!-- 悬浮部分 -->
        <div class="userInfo" ref="Info" v-if="visible">
          <div class="InfoUserAvatar">
            <div class="avatar" :style="{
              backgroundImage: `url(${mydata.userAvatar})`, backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }"></div>
            <button class="changeInfo" @click="openChange">修改信息</button>
          </div>

          <div class="InfoUserName">
            <div class="InfoTitle">昵称</div>
            <div class="content">{{ mydata.userName }}</div>
          </div>
          <div class="createAt">
            创建于{{ createAt }}
          </div>
        </div>
      </div>
      <div class="userName-nav" :title="mydata.userName">{{ mydata.userName }}</div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import { getPopFlex } from '@/models/flexpop/flexpop';
import createRoomSection from '@/components/sectionPop/createRoomSection.vue';
import { addBaseMessager } from '@/models';
const router = useRouter()
const inputRoomId = ref('');


// 根据 ID 进入房间
const handleEnterRoom = () => {
  if (!inputRoomId.value) { addBaseMessager('请输入房间号'); return };
  const targetId = inputRoomId.value;
  router.push({ name: 'draw', query: { roomId: targetId } })
};

// 离线
const handleOffline = () => {
  router.push({ name: 'draw' })
};

// 新建
const handleCreateRoom = async () => {
  // const data = await request<createRoom>('api/createCanvas', 'GET', {}, true)
  // console.log(getToken())
  // console.log(data)
  const pop = getPopFlex()
  if (!pop) return
  pop.value.open(createRoomSection, {})
};

// 登出
const handleLogout = () => {
  console.log('退出');

};
//用户模块

const createAt = ref('')


import userDataStore from '@/stores/userDataStores';
const userdata = userDataStore()
const mydata = userdata.getMyUserData()
onMounted(() => {
  try {
    const createTime = localStorage.getItem('createAt')
    //createat
    if (createTime)
      createAt.value = new Date(createTime).toLocaleString('zh-CN', { timeZone: 'UTC' })
  } catch (err) {

  }

})

//用户信息设置
import setUser from './sectionPop/setUser.vue';
const openChange = () => {
  const pop = getPopFlex()
  if (!pop) return
  pop.value.open(setUser, {})
}


//控制显示
const visible = ref(false)
const Info = ref()
//隐藏函数
const handleClickOutside = () => {
  visible.value = false
  document.removeEventListener('pointerup', listenInfo)
}

// 监听函数
const listenInfo = (e: PointerEvent) => {
  if (!Info.value?.contains(e.target as Node)) {
    handleClickOutside()
  }
}
// 主要函数
const handleInfo = (e: PointerEvent) => {
  e.stopPropagation()
  visible.value = true
  //鼠标捕获
  Info.value?.setPointerCapture(e.pointerId)
  // 挂载监听
  document.addEventListener('pointerup', listenInfo)
}
//人数
const peopleNum = ref(0)
import { myWebsocketClient } from '@/models';
function changePeople(data: any) {
  const aim = data.data
  peopleNum.value = aim.num
}
onMounted(() => {
  myWebsocketClient.on('allClientNum', changePeople)
})
onUnmounted(() => {
  myWebsocketClient.off('allClientNum', changePeople)
})
</script>

<style scoped>
.navbar {
  width: 100%;
  height: 64px;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
  padding: 0 24px;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  margin-bottom: 20px;
  gap: 10px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
  position: relative;
}





.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  /* 把第二个推到右边 */
  margin-right: 0;
  /* 确保右边距为0，紧贴第三个 */
}

.user {
  text-align: center;
  line-height: 36px;
  height: 36px;
  box-sizing: border-box;
  transform: translateY(2px);
}

.userName-nav {
  padding-left: 15px;
  display: inline-block;
  width: 80px;
  height: auto;
  line-height: 32px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  box-sizing: border-box;
  font-size: 13px;
}

/* 头像 */
.avatar {
  display: inline-block;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  line-height: 36px;
  cursor: pointer;
}

.avatar-cotain {
  display: inline-block;
  width: 32px;
  height: 32px;
}

.search-group {
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.search-input {
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 18px;
  padding: 0 36px 0 15px;
  outline: none;
  font-size: 14px;
  width: 160px;
  transition: all 0.3s;
  background-color: #f9f9f9;
}

.search-input:focus {
  border-color: #409eff;
  background-color: #fff;
  width: 200px;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.icon-btn {
  position: absolute;
  right: 4px;
  top: 4px;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background-color: #ecf5ff;
}

.nav-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.nav-btn:active {
  transform: scale(0.96);
}

.nav-btn.primary {
  background-color: #409eff;
  color: white;
}

.nav-btn.primary:hover {
  background-color: #66b1ff;
}

.nav-btn.secondary {
  background-color: #f4f4f5;
  color: #606266;
}

.nav-btn.secondary:hover {
  background-color: #e9e9eb;
  color: #333;
}

.nav-btn.danger {
  background-color: transparent;
  color: #f56c6c;
  border: 1px solid transparent;
}

.nav-btn.danger:hover {
  background-color: #fef0f0;
  border-color: #fde2e2;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: #e0e0e0;
  margin: 0 4px;
}

.userInfo {
  display: grid;
  grid-template-columns: 1fr;
  /* 保持单列布局 */
  grid-auto-rows: auto;
  /* 行高自动适应内容 */
  position: absolute;
  width: 150px;
  /* 最小宽度（防止太窄） */
  height: auto;
  /* 高度自动适应 */
  background-color: #fff;
  z-index: 9999;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateX(-90px);
}

.InfoUserAvatar {
  display: grid;
  grid-template-columns: 40px 1fr;
  /* 左边固定40px，右边自适应 */
  height: auto;
  /* 高度自适应 */
  min-height: 32px;
  /* 最小高度 */
  gap: 8px;
  align-items: center;
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
  /* 防止折行导致宽高乱跳 */
  padding-left: 10px;

  .avatar {
    cursor: auto;
  }

}

.InfoUserName {
  display: grid;
  grid-template-columns: 40px 1fr;
  /* 左边固定40px，右边自适应 */
  height: auto;
  /* 高度自适应 */
  min-height: 32px;
  /* 最小高度 */
  gap: 8px;
  align-items: center;
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
  /* 防止折行导致宽高乱跳 */
}

.InfoUserName .InfoTitle {
  font-weight: 500;
  color: #666;
  font-size: 13px;
  text-align: left;
  /* 标题左对齐更好看 */
}

.InfoUserName .content {
  padding-left: 0;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.InfoTitle {
  line-height: auto;
  padding-left: 10px;
}

.createAt {
  font-size: 12px;
  color: #999;
  line-height: 1;
  opacity: 0.8;
  height: 12px;
}

.changeInfo {
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.changeInfo:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f5faff;
}

.num-pop-enter-active,
.num-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.num-pop-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.num-pop-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.clientNum {
  position: absolute;
  top: 3px;
  left: 200px;
  font-size: 16px;
  white-space: nowrap;
  font-weight: 700;
  color: #8c8c8c;
}

.num-value {
  margin-left: 4px;
  font-weight: bold;
  color: #409eff;
  display: inline-block;
  min-width: 10px;
}
</style>
