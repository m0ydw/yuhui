<template>
  <div class="setUser">
    <div class="header">
      <div class="title">修改用户信息</div>
      <button class="cls" @click="emit('close')">关闭</button>
    </div>

    <div class="body">
      <!-- 左侧：头像区域 -->
      <div class="side">
        <div class="sideTitle">头像</div>
        <div class="avatarContainer">
          <div class="avatarPreview"></div>
          <button class="changeAvatarBtn" @click="triggerAvatarUpload">
            更换头像
          </button>
        </div>
      </div>

      <!-- 右侧：昵称 + 保存 -->
      <div class="main">
        <div class="previewBox">
          <div class="bigAvatarPreview"></div>
        </div>

        <div class="footer">
          <div class="meta">
            <div class="metaTitle">个人信息</div>

            <!-- 修改昵称 -->
            <div class="nameBox">
              <span class="nameTitle">昵称</span>
              <input type="text" class="userName" v-model="nickname" @input="handleInput" placeholder="请输入昵称" />
            </div>

          </div>

          <div class="action">
            <div class="saveBtn" @click="saveUserInfo" :class="{ disable: isReqIng }">
              保存修改
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 图片选择 -->
    <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="onAvatarSelected" />
    <!-- 图片裁剪 -->

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { addBaseMessager } from '@/models';
import avatarCropper from '../avatarCropper.vue';
const emit = defineEmits<{ close: [] }>()

// 昵称
const nickname = ref('')
const isReqIng = ref(false)

// 限制昵称长度
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.value.length > 16) {
    nickname.value = target.value.slice(0, 16)
    target.value = nickname.value
  }
}

// =============================================
// 触发 更换头像（你在这里写打开文件选择框逻辑）
// =============================================
import { request } from '@/api';
import { compressImage } from '@/utils/jpgZip';
const fileInput = ref<HTMLInputElement | null>(null)
const triggerAvatarUpload = () => {
  fileInput.value?.click()
  // 你写：文件选择、上传、预览等逻辑
  // uploadAvatar()
}
const onAvatarSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const compressedFile = await compressImage(file)
    const formData = new FormData()
    formData.append('avatar', compressedFile)
    console.log(formData)
    const res = await request<{}>(
      'api/uploadAvatar',
      'POST',
      formData,
      true,
      false,
      true
    )
    console.log('上传成功', res)
  } catch (err) {
    console.error('上传失败', err)
  } finally {
    target.value = ''
  }
}
// =============================================
// 保存昵称（提交到后端）
// =============================================
const saveUserInfo = async () => {
  if (!nickname.value.trim()) {
    addBaseMessager('请输入昵称')
    return
  }

  isReqIng.value = true
  try {
    // ==========================================
    // 这里写调用 修改昵称 接口
    // await request('api/updateNickname', 'POST', { nickname: nickname.value })
    // ==========================================

    addBaseMessager('保存成功')
    emit('close')
  } catch (err) {
    console.error(err)
  } finally {
    isReqIng.value = false
  }
}

onMounted(() => {
  try {
    let str = localStorage.getItem('User_Data')
    if (!str) throw new Error('noStr')
    let userData = JSON.parse(str)
    if (!userData.name || !userData.createAt) throw new Error('noRealData')
    console.log(userData)

    //初始化
    nickname.value = userData.name

  } catch (err) {

  }
})
</script>

<style scoped>
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
</style>