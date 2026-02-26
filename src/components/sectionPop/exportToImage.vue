<template>
  <div class="exportImage">
    <img v-if="imgUrl" :src="imgUrl" alt="预览图" class="imageRes"></img>
    <span v-else>生成预览中...</span>
  </div>
</template>

<script setup lang="ts">
import { type Board } from '@/models';
import { boardDataToImage } from '@/utils';
import { ref, onMounted } from 'vue';
interface Prop {
  boardData: Board
}
const props = defineProps<Prop>()
const imgUrl = ref('')
onMounted(async () => {
  const strokes = props.boardData.getAllStrokes()
  const base64Str = await boardDataToImage(strokes, {
    bgColor: '#ffffff', // 默认白底，如果不想要背景可以去掉这行
  })
  imgUrl.value = base64Str

})
</script>

<style scoped>
.exportImage {
  width: 60vw;
  height: 60vh;

}

.imageRes {
  width: 100%;
  /* 尝试占满宽 */
  height: 100%;
  /* 尝试占满高 */
  object-fit: contain;
  /* 关键！保持比例，长边对齐，短边留白 */
}
</style>
