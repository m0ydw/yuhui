<template>
  <div class="setUser" :class="{ isImg: showCropper }">
    <div class="header" v-if="!showCropper">
      <div class="title">修改用户信息</div>
      <button class="cls" @click="emit('close')">关闭</button>
    </div>

    <div class="body" v-if="!showCropper">
      <div class="side">
        <div class="sideTitle">头像</div>
        <div class="avatarContainer">
          <div class="avatarPreview" :style="{
            backgroundImage: `url(${mydata.userAvatar})`, backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }"></div>
          <button class="changeAvatarBtn" @click="triggerAvatarUpload">更换头像</button>
        </div>
      </div>

      <div class="main">
        <div class="previewBox">
          <div class="bigAvatarPreview" :style="{
            backgroundImage: `url(${mydata.userAvatar})`, backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }"></div>
        </div>

        <div class="footer">
          <div class="meta">
            <div class="metaTitle">个人信息</div>
            <div class="nameBox">
              <span class="nameTitle">昵称</span>
              <input type="text" class="userName" v-model="nickname" @input="handleInput" placeholder="请输入昵称" />
            </div>
          </div>

          <div class="action">
            <div class="saveBtn" @click="saveUserInfo" :class="{ disable: isReqIng }">保存修改</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片选择 -->
    <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onAvatarSelected" />

    <!-- 子组件裁剪 -->
    <div v-if="showCropper" class="cropper-wrapper">
      <AvatarCropper :file="selectedFile" @close="showCropper = false" @success="onCropSuccess" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AvatarCropper from './AvatarCropper.vue'
import { compressImage } from '@/utils/jpgZip'
import { request } from '@/api'
import { addBaseMessager } from '@/models'
import userDataStore from '@/stores/userDataStores'
const userData = userDataStore()
const mydata = userData.getMyUserData()


const emit = defineEmits<{ close: [] }>()

const nickname = ref('')
const isReqIng = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const showCropper = ref(false)
const selectedFile = ref<File | null>(null)

const triggerAvatarUpload = () => {
  fileInput.value?.click()
}

const onAvatarSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  selectedFile.value = file
  showCropper.value = true
  target.value = ''
}
const onCropSuccess = async (blob: Blob) => {
  if (!blob) return

  try {
    const compressedFile = new File([blob], 'avatar.jpg', { type: blob.type, lastModified: Date.now() })
    const formData = new FormData()
    formData.append('avatar', compressedFile)

    // 上传裁剪后的头像
    const res = await request<{ url: string }>('api/uploadAvatar', 'POST', formData, true, false, true)
    console.log('上传成功', res)
    if (res.code === 200) {
      addBaseMessager('头像上传成功')
      //更新userdata
      userData.changeMyAvatar(res.data.url)
    } else {
      addBaseMessager('头像上传失败')
    }
  } catch (err) {
    console.error('上传失败', err)
  } finally {
    showCropper.value = false
  }
}

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.value.length > 16) {
    nickname.value = target.value.slice(0, 16)
    target.value = nickname.value
  }
}

const saveUserInfo = async () => {
  if (!nickname.value.trim()) {
    addBaseMessager('请输入昵称')
    return
  }
  isReqIng.value = true
  try {
    const res = await request<{ nickname: string }>('api/updateNickname', 'POST', { nickname: nickname.value }, true)

    if (res.code === 200) {
      addBaseMessager('保存成功')
      userData.changeMyName(res.data.nickname)
    } else {
      addBaseMessager(res.message)
    }
    emit('close')
  } catch (err) {
    console.error(err)
  } finally {
    isReqIng.value = false
  }
}
//初始化
import { onMounted } from 'vue'
import { URLSERVER } from '@/api'

onMounted(() => {
  try {
    nickname.value = mydata.value.userName

  } catch (err) {
    console.log(err)
  }
})

</script>
<style>
.setUser {
  width: min(700px, 92vw);
  height: min(500px, 80vh);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

/* 头部 */
.header {
  height: 50px;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  background: linear-gradient(180deg, #ffffff, #fafafa);
  border-bottom: 1px solid #eee;
  line-height: 50px;
}

.cls {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
}

.title {
  font-weight: 600;
}

/* 主体布局 */
.body {
  flex: 1;
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 0;
}

/* 左侧 */
.side {
  border-right: 1px solid #eee;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sideTitle {
  font-size: 12px;
  color: #666;
  margin-bottom: 20px;
}

.avatarContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.avatarPreview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #e0e0e0;
}

.changeAvatarBtn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  border: 1px solid #eee;
  background: #fff;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.changeAvatarBtn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #f5faff;
}

/* 右侧 */
.main {
  min-height: 0;
  display: grid;
  grid-template-rows: 1fr auto;
  padding: 12px;
  gap: 12px;
}

.previewBox {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #eee;
  border-radius: 12px;
}

.bigAvatarPreview {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: #e0e0e0;
}

/* 底部表单 */
.footer {
  border-top: 1px solid #eee;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metaTitle {
  font-size: 16px;
  font-weight: 600;
}

.nameBox {
  display: grid;
  grid-template-columns: 50px 1fr;
  gap: 10px;
  margin-top: 12px;
  align-items: center;
}

.nameTitle {
  color: #409eff;
  font-weight: 600;
}

.userName {
  height: 32px;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0 12px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.2s;
}

.userName:focus {
  border-color: #409eff;
}

.action {
  display: flex;
  justify-content: end;
}

.saveBtn {
  height: 36px;
  padding: 0 20px;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  margin-top: 12px;
}

.saveBtn:hover {
  background: #66b1ff;
}

.saveBtn.disable {
  background: #b3d7ff;
  cursor: not-allowed;
}

.isImg {
  position: relative;
  /* 父组件保持布局 */
  box-shadow: none;
  border-radius: none;
  border: none;
}

/* 隐藏原本内容，但保留父容器 */
.setUser.isImg>*:not(.cropper-wrapper) {
  visibility: hidden;
  /* 或 opacity: 0 */
}

/* 裁剪器覆盖整个父组件 */
.cropper-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  background: #fff;
  /* 或半透明遮罩 */
}
</style>