<template>
  <nav class="navbar">
    <div class="logo">
      <span class="icon"></span>
      <span class="text">绘图大厅</span>
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
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { request, type createRoom } from '@/api';
import { getToken } from '@/api';

const router = useRouter()
const inputRoomId = ref('');


// 根据 ID 进入房间
const handleEnterRoom = () => {
  if (!inputRoomId.value) return alert('请输入房间号');

  const targetId = inputRoomId.value;
  router.push({ name: 'draw', query: { roomId: targetId } })
};

// 离线
const handleOffline = () => {
  router.push({ name: 'draw' })
};

// 新建
const handleCreateRoom = async () => {
  const data = await request<createRoom>('api/createCanvas', 'GET', {}, true)
  console.log(getToken())
  console.log(data)
};

// 登出
const handleLogout = () => {
  console.log('退出');

};

</script>

<style scoped>
.navbar {
  width: 100%;
  height: 64px;
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 100;
  margin-bottom: 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
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
</style>
