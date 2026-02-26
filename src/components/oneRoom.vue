<template>
  <div class="oneRoom">
    <div class="room-info">
      <div class="room-name" :title="props.roomData.roomName">
        {{ props.roomData.roomName }}
      </div>

      <div class="room-num-wrapper">
        <span class="label">当前人数:</span>
        <Transition name="num-pop" mode="out-in">
          <span :key="props.roomData.num" class="num-value">
            {{ props.roomData.num }}
          </span>
        </Transition>
      </div>
    </div>

    <button class="enter" @click="enter">进入</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { type roomState } from '@/models';

const router = useRouter()

interface Prop {
  roomData: roomState
}

const props = defineProps<Prop>()

function enter() {
  router.replace({ name: 'draw', query: { roomId: `${props.roomData.roomId}` } })
}
</script>

<style scoped>
.oneRoom {
  width: 250px;
  height: 110px;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  overflow: hidden;
  margin: 10px;
}

.oneRoom:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: #dcdcdc;
}

.room-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  /*稍微拉开一点距离*/
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.room-num-wrapper {
  font-size: 13px;
  color: #888;
  display: flex;
  align-items: center;
}

.label {
  margin-right: 4px;
}

.num-value {
  font-weight: bold;
  color: #409eff;
  display: inline-block;
  min-width: 10px;
}


.enter {
  all: unset;
  position: absolute;
  right: 16px;
  bottom: 16px;
  background-color: #409eff;
  color: white;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

.enter:hover {
  background-color: #66b1ff;
}

.enter:active {
  background-color: #3a8ee6;
  transform: scale(0.96);
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
</style>
