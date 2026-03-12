<template>
  <div class="penSelect">
    <colorSelectModel @update:modelValue="colorChange" :modelValue="toolBarStores.getNowColor()"></colorSelectModel>
    <!-- size滑块 -->
    <div class="size-slider">
      <label for="pen-size">宽</label>
      <input type="range" class="size-range" id="pen-size" v-model="visitSize" :min="minSize" :max="maxSize"
        :step="stepSize" ref="rangeInputRef" :style="trackStyle">
      <!-- 展示模式 -->
      <div class="bubble" :style="bubbleStyle">
        <div v-if="!isEdit" class="size-display size-base" @click="enterEdit">{{ visitSize }}</div>
        <!-- 编辑模式 -->
        <input v-if="isEdit" id="pen-size-number" class="size-base size-change" type="number" v-model="visitSize"
          :min="minSize" :max="maxSize" :step="stepSize" @blur="handleBlur" ref="sizeInput">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import colorSelectModel from './colorSelectModel.vue';
import toolBarData from '@/stores/toolBarStores';
import { nextTick, ref, computed, watch } from 'vue';
const toolBarStores = toolBarData()
const colorChange = (aim: string) => {
  toolBarStores.changeNowColor(aim)
}

// pensize实现
const minSize = ref(1)
const maxSize = ref(100)
const stepSize = ref(1)
const penSize = ref(toolBarStores.getPenSize())
const isEdit = ref(false)
const sizeInput = ref<HTMLInputElement | null>(null)
const rangeInputRef = ref<HTMLInputElement | null>(null)
const thumbWidth = 20//滑块的宽度
// 进入输入模式
const enterEdit = () => {
  isEdit.value = true
  // 下一时刻确保dom已经更新
  nextTick(() => {
    // 获得焦点
    sizeInput.value?.focus()
  })

}
// penSize的安全管理
const visitSize = computed({
  get() {
    return penSize.value
  },
  set(newValue) {
    // @ts-expect-error - TS(2367): This comparison is intentional.
    if (newValue === null || newValue === undefined || isNaN(newValue) || newValue === '') {
      // 如果新值是 null、undefined 或非数字，则重置为最小值
      penSize.value = minSize.value;
    } else if (newValue >= maxSize.value) {
      penSize.value = maxSize.value
    }
    else {
      // 否则，正常更新值
      penSize.value = newValue;
    }
  }
})
// 监听pensize传到toolbardata
watch(penSize, (newValue) => {
  toolBarStores.setPenSize(newValue)
})
// 判断输入
const handleBlur = () => {
  isEdit.value = false
}
// 气泡位置
const bubbleStyle = computed(() => {
  if (!rangeInputRef.value || visitSize.value === undefined) {
    return { left: '0px' };
  }

  // 获取需要的所有值
  const slider = rangeInputRef.value;
  const val = Number(visitSize.value);
  const min = Number(minSize.value);
  const max = Number(maxSize.value);

  // 获取轨道的实际像素宽度
  const sliderWidth = slider.offsetWidth;

  // 应用正确的映射公式
  // 1. 计算当前值所占的百分比
  const percentage = (val - min) / (max - min);

  // 2. 计算按钮中心点的像素位置
  // (轨道可用宽度 * 百分比) + 中心点偏移
  const thumbCenter = percentage * (sliderWidth - thumbWidth) + (thumbWidth / 2);

  return {
    left: `${thumbCenter}px`,
  };
})
// 动态填充
const trackStyle = computed(() => {
  const val = Number(visitSize.value);
  const min = Number(minSize.value);
  const max = Number(maxSize.value);

  // 计算当前值所占的百分比
  const percentage = (val - min) / (max - min) * 100;

  // 返回样式对象
  return {
    // 选用颜色
    background: `linear-gradient(to right, ${toolBarStores.getNowColor()} ${percentage}%, ${getContrastColor(toolBarStores.getNowColor())} ${percentage}%)`
  };
});
// 判断颜色选择
function getContrastColor(hexColor: string): string {
  // 1. 预处理 Hex 颜色，移除 '#' 并处理缩写形式 (如 #F00 -> #FF0000)
  let hex = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // 2. 将 Hex 转换为 RGB 数值
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const colors = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  const luminance = 0.2126 * colors[0]! + 0.7152 * colors[1]! + 0.0722 * colors[2]!;

  // 4. 根据亮度阈值返回黑色或白色
  //    0.5 是一个常用的、简单的分界点
  return luminance > 0.5 ? '#415462' : '#a2afb9';
}

</script>

<style scoped>
.penSelect {
  height: 376px;
}

.size-slider {
  position: relative;
  height: 8px;
  width: 240px;
  margin-top: 8px;
  cursor: pointer;
  display: flex;
  flex-wrap: wrap;
}

.size-slider label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex-shrink: 0;
  margin-right: 5px;
  margin-left: 5px;
}

.bubble {
  position: absolute;
  transform: translate(49%, 80%);
}

.size-range {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  outline: none;
  width: 200px;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  cursor: pointer;
  transform: translate(0, 80%);
  border: 1px solid silver;
}


/* 修改滑块 */
.size-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  background: #ffffff;
  border: 2px solid #007bff;
  border-radius: 50%;
  cursor: pointer;
}

/* div和input共享的style */
.size-base {
  padding: 0;
  margin: 0;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  width: 25px;
  text-align: center;
}



/* 取消箭头 */
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
</style>
