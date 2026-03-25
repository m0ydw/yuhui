<template>
  <div class="shell">
    <div class="container a-container" :class="{ 'is-txl': isVerify }">
      <form class="form" @submit.prevent="handleSendCode" v-if="!isVerify">
        <h2 class="form_title title">忘记密码</h2>

        <div class="form_icons">
          <i class="iconfont icon-QQ"></i>
          <i class="iconfont icon-weixin"></i>
          <i class="iconfont icon-bilibili-line"></i>
        </div>

        <input v-model="form.email" class="form_input" placeholder="Email" />
        <input
          v-model="form.password"
          class="form_input"
          type="password"
          placeholder="新密码"
        />
        <input
          v-model="form.confirm"
          class="form_input"
          type="password"
          placeholder="确认新密码"
        />

        <button :disabled="sendButtonDisabled" class="button">发送验证码</button>
      </form>

      <!-- 复用注册时的 6 位验证码样式 -->
      <div class="code-box" v-else>
        <div class="code-view" ref="view" @click="">
          <div
            class="code-item"
            v-for="(item, idx) in 6"
            :key="idx"
            :class="{ codeActive: idx === code.length && focused }"
          >
            {{ code[idx] || '' }}
          </div>
        </div>

        <input
          type="text"
          class="code-input"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="one-time-code"
          @keydown="onKeydown"
          @paste.prevent
          @input="onInput"
          ref="codeInput"
        />
      </div>
    </div>

    <div class="container b-container" :class="{ 'is-txl': !isVerify, 'is-z': isVerify }">
      <div class="switch_container" :class="{ 'is-hidden': false }">
        <h2 class="switch_title title">{{ isVerify ? '输入验证码' : '重置密码' }}</h2>
        <p class="description">
          {{
            isVerify
              ? '6 位验证码已发送到邮箱，请在 5 分钟内完成验证'
              : '请输入邮箱和新密码，我们会发送验证码完成重置'
          }}
        </p>

        <button
          class="button"
          v-if="isVerify"
          @click="handleBackToEdit"
          :disabled="verifyBusy"
        >
          返回修改
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import router from '@/router'
import { request, type forgotData, type realForgotData } from '@/api'
import { addBaseMessager } from '@/models'

const isVerify = ref(false)

const form = reactive({
  email: '',
  password: '',
  confirm: '',
})

const code = ref('')
const focused = ref(true)
const view = ref<HTMLElement | undefined>(undefined)
const codeInput = ref<HTMLInputElement | null>(null)
const changeInput = ref(true)

const sendButtonDisabled = ref(false)
const verifyBusy = ref(false)

const emailReg = /^(?=.{1,80}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const passwordReg = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{8,45}$/

const onKeydown = (e: KeyboardEvent) => {
  if (
    e.ctrlKey ||
    e.metaKey ||
    ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
  ) {
    return
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
    return
  }
  if (code.value.length >= 6) {
    e.preventDefault()
  }
}

const onInput = async (e: Event) => {
  if (!changeInput.value) return
  const el = e.target as HTMLInputElement
  const next = el.value

  if (!/^\d{0,6}$/.test(next)) {
    el.value = code.value
    return
  }

  code.value = next
  if (code.value.length !== 6) return

  changeInput.value = false
  focused.value = false
  codeInput.value?.blur()
  verifyBusy.value = true

  // 满 6 位后直接校验并重置密码
  const params = { code: code.value, email: form.email }
  const response = await request<realForgotData>('api/realForgot', 'POST', params, false)
  if (response.code !== 200 || response.data?.type !== 'finallyForgot') {
    addBaseMessager(response.data?.status || '验证码错误')
    verifyBusy.value = false
    changeInput.value = true
    focused.value = true
    codeInput.value?.focus()
    return
  }

  addBaseMessager('密码重置成功，请登录')
  await nextTick()
  verifyBusy.value = false
  router.push({ name: 'Login' })
}

const judgeInput = (e: PointerEvent) => {
  if (!changeInput.value || !isVerify.value) return
  const target = e.target as Node | null
  if (!target) return
  if (view.value && view.value.contains(target)) {
    focused.value = true
    codeInput.value?.focus()
  } else if (view.value && !view.value.contains(target)) {
    focused.value = false
    codeInput.value?.blur()
  }
}

onMounted(() => {
  document.addEventListener('pointerup', judgeInput)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerup', judgeInput)
})

async function handleSendCode() {
  if (sendButtonDisabled.value) return
  sendButtonDisabled.value = true
  verifyBusy.value = false

  if (!form.email || !emailReg.test(form.email)) {
    addBaseMessager('邮箱非法')
    sendButtonDisabled.value = false
    return
  }
  if (!form.password || !passwordReg.test(form.password)) {
    addBaseMessager('密码仅支持字母、数字与特殊字符，长度8-45')
    sendButtonDisabled.value = false
    return
  }
  if (form.password !== form.confirm) {
    addBaseMessager('两次密码不一致')
    sendButtonDisabled.value = false
    return
  }

  const params = { email: form.email, password: form.password }
  const response = await request<forgotData>('api/forgot', 'POST', params, false)

  if (response.data?.type === 'forgotaccess') {
    addBaseMessager('验证码已发送')
    isVerify.value = true
    sendButtonDisabled.value = false
    await nextTick()
    codeInput.value?.focus()
  } else {
    addBaseMessager(response.data?.status || '发送失败')
    sendButtonDisabled.value = false
  }
}

function handleBackToEdit() {
  // 返回修改时允许重新发送验证码/输入
  isVerify.value = false
  code.value = ''
  changeInput.value = true
  focused.value = true
  verifyBusy.value = false
  sendButtonDisabled.value = false
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
}

body {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  background-color: #ecf0f3;
  color: #aea5a8;
}

.shell {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1000px;
  min-width: 1000px;
  height: 600px;
  background-color: #ecf0f3;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 10px 10px 10px #d1d9e6,
    -10px -10px 10px #f9f9f9;
}

.container {
  position: absolute;
  top: 0;
  width: 600px;
  height: 100%;
  padding: 25px;
  background-color: #ecf0f3;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.a-container {
  left: calc(100% - 608px);
  z-index: 100;
}

.b-container {
  left: calc(100% - 608px);
  z-index: 0;
}

.form {
  position: relative;
  left: 58px;
  top: 66px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form_icons {
  margin: 10px 0;
}

.form_input {
  width: 350px;
  height: 40px;
  margin: 4px 0;
  padding-left: 22px;
  font-size: 13px;
  border: none;
  outline: none;
  border-radius: 8px;
  background-color: #ecf0f3;
  box-shadow: inset 2px 2px 4px #d1d9e6,
    inset -2px -2px 4px #f9f9f9;
  transition: 0.25s ease;
}

.form_input:focus {
  box-shadow: inset 4px 4px 6px #d1d9e6,
    inset -4px -4px 6px #f9f9f9;
}

.form_link {
  margin-top: 18px;
  font-size: 14px;
  color: #181818;
  text-decoration: none;
  border-bottom: 1px solid #aaa;
}

.title {
  font-size: 34px;
  font-weight: 700;
  color: #181818;
  letter-spacing: 6px;
  white-space: nowrap;
}

.switch_container {
  position: absolute;
  width: 100%;
  padding: 50px 55px;
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 156px;
  left: 0px;
}

.description {
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

.button {
  width: 180px;
  height: 50px;
  margin-top: 40px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  border: none;
  outline: none;
  cursor: pointer;
  background-color: #4878e2;
  color: #fff;
  box-shadow: 8px 8px 16px #d1d9e6,
    -8px -8px 16px #f9f9f9;
  transition: 0.25s;
}

.button:disabled {
  background-color: #cccccc;
  color: #666666;
  cursor: not-allowed;
  box-shadow: none;
}

/* 复用注册时的验证码样式 */
.code-box {
  background-color: #4878e2;
  width: 100%;
  height: 100%;
  position: relative;
}

.code-input {
  position: absolute;
  left: 100px;
}

.code-view {
  width: 350px;
  height: 50px;
  position: absolute;
  left: 120px;
  top: 200px;
  background-color: black;
  white-space: nowrap;
  z-index: 4;
}

.code-item {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 2px solid #ccc;
  background: #fff;
  border-radius: 3px;
  margin-right: 10px;
  line-height: 50px;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  color: #3f86ff;
}
</style>

