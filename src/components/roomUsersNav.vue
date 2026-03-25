<template>
  <div id="room-users-nav" class="room-nav" :style="{ transform: expanded ? 'translateY(-100%)' : 'none' }">
    <!-- 展开/收起：通过 maxHeight 控制高度，收起时只露出下方按钮 -->
    <div class="nav-panel-wrapper">
      <div class="nav-panel">
        <div class="nav-left">
          <div class="room-name">{{ roomName }}</div>
        </div>

        <div class="nav-right">
          <div class="avatar-list">
            <div v-for="u in users" :key="u.userId" class="avatar-item">
              <button class="avatar-btn" :class="{ active: openedUserId === u.userId }" @click="toggleUser(u.userId)">
                <div class="avatar" :style="{ backgroundImage: `url(${u.avatar})` }"></div>
              </button>

              <div v-if="openedUserId === u.userId" class="dropdown">
                <div class="dropdown-header">
                  {{ u.name }}
                </div>

                <button v-if="isOwner && u.userId !== myId" class="dropdown-remove" @click="openKickConfirm(u)">
                  移除该用户
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 收起/伸出按钮：永远显示在导航栏下方 -->
    <div class="toggle-slot">
      <button v-if="expanded" class="toggle-btn" @click="setExpanded(false)" aria-label="收起">
        ^
      </button>
      <button v-else class="toggle-btn" @click="setExpanded(true)" aria-label="展开">
        ˅
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getUserId } from '@/models/webSocket/cilentExample'
import { getPopFlex } from '@/models/flexpop/flexpop'
import kickUserConfirm from '@/components/sectionPop/kickUserConfirm.vue'

interface UserItem {
  userId: string
  name: string
  avatar: string
}

const props = defineProps<{
  roomName: string
  roomId: string
  homeowner: string
  users: UserItem[]
}>()

const myId = getUserId()
const isOwner = computed(() => props.homeowner && props.homeowner === myId)

const expanded = ref(false)
const openedUserId = ref<string>('')
const pop = getPopFlex()

watch(
  () => props.users,
  () => {
    // 用户列表变化时，关闭打开的下拉，避免指向不存在的对象
    openedUserId.value = ''
  },
)

function toggleUser(userId: string) {
  openedUserId.value = openedUserId.value === userId ? '' : userId
}

function openKickConfirm(user: UserItem) {
  openedUserId.value = ''
  if (!pop) return
  pop.value.open(kickUserConfirm, {
    roomId: props.roomId,
    targetUserId: user.userId,
    targetName: user.name,
  })
}



function setExpanded(next: boolean) {
  console.log(expanded.value)
  expanded.value = next
  //全局css变量
  if (next) {
    document.documentElement.style.setProperty('--room-users-nav-height', '0px')
  } else {
    document.documentElement.style.setProperty('--room-users-nav-height', '64px')
  }
}
</script>

<style scoped>
.room-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 9;
  /* toolbar 是 10，避免遮挡 */
  pointer-events: auto;
  border-bottom: 2px solid rgba(0, 0, 0, 0.345);
  transition: all 0.3s ease;
}

.nav-panel-wrapper {
  /* overflow: hidden; */
  width: 100%;
  background: #ffffff;
  padding: 0 20px;
  border-bottom: none;
}

.nav-panel {
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room-name {
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  /* overflow: hidden; */
  text-overflow: ellipsis;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  flex: 1;
}

.avatar-list {
  display: flex;
  align-items: right;
  gap: 10px;
  justify-content: flex-end;
  max-width: 100%;
  padding-right: 50px;
}

.avatar-item {
  position: relative;
}

.avatar-btn {
  all: unset;
  cursor: pointer;
}

.avatar-btn.active .avatar {
  outline: 3px solid #409eff;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e5e7eb;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.toggle-btn {
  all: unset;
  cursor: pointer;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f3f4f6;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.toggle-btn:hover {
  background: #e5e7eb;
}

.toggle-slot {
  display: inline-block;
  position: absolute;
  align-items: center;
  background: #ffffff;
  background-color: #409eff;
  height: 44px;
}

.dropdown {
  position: absolute;
  right: -10px;
  top: 44px;
  width: 170px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  padding: 10px;
}

.dropdown-header {
  font-weight: 700;
  color: #111827;
  font-size: 13px;
  margin-bottom: 10px;
  white-space: nowrap;
  /* overflow: hidden; */
  text-overflow: ellipsis;
}

.dropdown-remove {
  all: unset;
  display: block;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  background: rgba(245, 108, 108, 0.1);
  color: #dc2626;
  text-align: center;
  font-weight: 600;
}

.dropdown-remove:hover {
  background: rgba(245, 108, 108, 0.18);
}
</style>
