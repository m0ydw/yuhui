<!-- src/views/Login.vue -->
<template>
  <div class="auth-wrap">
    <div class="auth-box">
      <!-- 顶部按钮 + 滑块 -->
      <div class="tabs">
        <button :class="{ active: isLogin }" @click="isLogin = true">登录</button>
        <button :class="{ active: !isLogin }" @click="isLogin = false">注册</button>
        <span class="slider" :class="{ right: !isLogin }"></span>
      </div>

      <!-- 表单区域 -->
      <form @submit.prevent="handleSubmit">
        <h2 class="title">{{ isLogin ? '欢迎回来' : '创建账户' }}</h2>

        <!-- 注册才显示的字段 -->
        <div class="field" v-if="!isLogin">
          <input v-model="form.name" type="text" placeholder="昵称" required />
        </div>

        <div class="field">
          <input v-model="form.email" type="email" placeholder="邮箱" required />
        </div>

        <div class="field">
          <input v-model="form.password" type="password" placeholder="密码" required />
        </div>

        <button class="submit-btn" type="submit">
          {{ isLogin ? '登录' : '注册' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const isLogin = ref(true)

const form = reactive({
  name: '',
  email: '',
  password: ''
})

async function handleSubmit() {
  if (isLogin.value) {
    console.log('登录', form.email, form.password)
    // await login(form)
    // router.replace('/rooms')
  } else {
    console.log('注册', form)
    // await register(form)
    // 注册完可直接帮用户登录，或自动切到登录态
  }
}
</script>

<style scoped>
.auth-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-60deg, #a8c5ff, #c7b8ff, #b0e0ff, #d0f0c0, #f8d9d9, #a8c5ff);
  background-size: 600% 600%;
  animation: gradientShift 6s ease infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.auth-box {
  width: 380px;
  padding: 40px 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

/* 顶部按钮 */
.tabs {
  position: relative;
  display: flex;
  margin-bottom: 24px;
}

.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s;
}

.tabs button.active {
  color: #6e8efb;
}

/* 滑块 */
.slider {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50%;
  height: 3px;
  background: linear-gradient(90deg, #6e8efb, #a777e3);
  border-radius: 2px;
  transition: transform 0.3s ease;
}

.slider.right {
  transform: translateX(100%);
}

/* 表单 */
.title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 22px;
  color: #333;
}

.field {
  margin-bottom: 16px;
}

.field input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.6);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.field input:focus {
  outline: none;
  border-color: #6e8efb;
  box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.2);
}

.submit-btn {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(110, 142, 251, 0.4);
}
</style>