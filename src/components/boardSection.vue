<template>
  <div class="boardSection" ref="root">
    <!-- 按钮 -->
    <button class="btn" :class="{ 'open': isOpen }" @click="toggle">
      <span>+</span>
    </button>

    <!-- 菜单 -->
    <Transition name="my-transition">
      <div v-if="isOpen" class="menu">
        <div v-for="item in items" :key="item.key" class="item" @click="select(item.key)">
          {{ item.label }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Item { key: string; label: string; }

// 如果父组件不传，就用默认的
const props = withDefaults(defineProps<{ items?: Item[] }>(), {
  items: () => [
    { key: 'save', label: '保存' },
    { key: 'load', label: '读取' },
    { key: 'export', label: '导出图片' },
    { key: 'clear', label: '清空画布' },
    { key: 'grid', label: '网格线开关' },
  ]
})

const emit = defineEmits(['select']);
const isOpen = ref(false);
const root = ref<HTMLElement | null>(null);

const toggle = () => isOpen.value = !isOpen.value;

const select = (key: string) => {
  emit('select', key);
  isOpen.value = false;
};

// 点击空白处关闭
const closeOnClickOutside = (e: MouseEvent) => {
  if (root.value && !root.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', closeOnClickOutside));
onUnmounted(() => document.removeEventListener('click', closeOnClickOutside));
</script>

<style scoped>
.boardSection {
  position: relative;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #409eff;
  color: #fff;
  font-size: 28px;
  font-weight: 300;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 4px;
}

.btn:hover {
  transform: scale(1.1);
  background: #66b1ff;
}

.btn.open {
  background: #f56c6c;
  transform: rotate(45deg);
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.4);
}

.btn span {
  transform: translateY(2px);
}

.menu {
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 5px 0;
  min-width: 120px;
  border: 1px solid #ebeef5;
  z-index: 1000;
  gap: 5px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: background 0.2s;
  text-align: center;
}

.item:hover {
  background: #f0f7ff;
  color: #409eff;
}

/* 动画 */
.my-transition-enter-active,
.my-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  transform-origin: top left;
}

.my-transition-enter-from,
.my-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}
</style>
