<template>
  <div class="exportImage">
    <img v-if="imgUrl" :src="imgUrl" alt="预览图" class="imageRes"></img>
    <span v-else>生成预览中...</span>
    <button v-if="imgUrl" class="downloadBtn" @click="downloadImage">下载图片</button>
  </div>
</template>

<script setup lang="ts">
import { type Board } from '@/models';
import { boardDataToImage } from '@/utils';
import { ref, onMounted } from 'vue';

interface Prop {
  boardData: Board
}

const props = defineProps<Prop>();
const imgUrl = ref('');

onMounted(async () => {
  const strokes = props.boardData.getAllStrokes();
  const base64Str = await boardDataToImage(strokes, {
    bgColor: '#ffffff', // 默认白底，如果不想要背景可以去掉这行
  });
  console.log(base64Str);
  imgUrl.value = base64Str;
});

// 下载图片的方法
const downloadImage = () => {
  if (!imgUrl.value) return;

  const link = document.createElement('a');
  link.href = imgUrl.value;
  link.download = 'exported-image.png'; // 下载的文件名
  link.click();
};
</script>

<style scoped>
.exportImage {
  width: 60vw;
  height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  background-color: rgba(230, 235, 240, 0.9);
  box-shadow: 0 6px 12px rgba(100, 110, 120, 0.12);
}

.imageRes {
  width: 80%;
  height: 80%;
  object-fit: contain;
  margin-bottom: 16px;
}

.downloadBtn {
  padding: 8px 16px;
  font-size: 16px;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.downloadBtn:hover {
  background-color: #0056b3;
}
</style>