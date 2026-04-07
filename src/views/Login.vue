<template>
  <div class="shell">
    <!-- 注册容器 -->
    <div class="container a-container" :class="{ 'is-txl': isLogin }">
      <form class="form" @submit.prevent="handleRegister" v-if="leftMode === 'register' && !formReg && !forgotVerify">
        <h2 class="form_title title">创建账号</h2>

        <div class="form_icons">
          <i class="iconfont icon-QQ"></i>
          <i class="iconfont icon-weixin"></i>
          <i class="iconfont icon-bilibili-line"></i>
        </div>


        <input v-model="registerForm.name" class="form_input" placeholder="用户名" />
        <input v-model="registerForm.email" class="form_input" placeholder="Email" />
        <input v-model="registerForm.password" class="form_input" type="password" placeholder="Password" />
        <input v-model="registerForm.confirm" class="form_input" type="password" placeholder="确认密码" />

        <button :disabled="regButton" class="button">SIGN UP</button>
      </form>
      <!-- 忘记密码：输入邮箱 + 新密码 -->
      <form class="form" @submit.prevent="handleForgotSendCode" v-if="leftMode === 'forgot' && !forgotVerify">
        <h2 class="form_title title">忘记密码</h2>

        <div class="form_icons">
          <i class="iconfont icon-QQ"></i>
          <i class="iconfont icon-weixin"></i>
          <i class="iconfont icon-bilibili-line"></i>
        </div>

        <input v-model="forgotForm.email" class="form_input" placeholder="Email" />
        <input v-model="forgotForm.password" class="form_input" type="password" placeholder="新密码" />
        <input v-model="forgotForm.confirm" class="form_input" type="password" placeholder="确认新密码" />

        <button :disabled="forgotSendButtonDisabled" class="button">发送验证码</button>
      </form>
      <!-- 验证码界面 -->
      <div class="code-box" v-if="formReg || forgotVerify">
        <div class="title codeTitle">请输入验证码</div>
        <div class="code-view" @click="" ref="view">
          <div class="code-item" v-for="(item, idx) in 6" :key="idx"
            :class="{ codeActive: idx === code.length && focused, regFalse: regBoolean }">
            {{ code[idx] || '' }}
          </div>
          <button @click="reSendCode()" :disabled="!reSendBoolean" class="reSend-btn">重新发送
            <span v-if="!reSendBoolean" class="count-text">{{ `(${countDown})` }}</span>
          </button>
        </div>

        <div class="goBack" @click="goBack">返回</div>
      </div>
      <input v-if="formReg || forgotVerify" type="text" class="code-input" inputmode="numeric" pattern="[0-9]*"
        autocomplete="one-time-code" @keydown="onKeydown" @paste.prevent @input="onInput" ref="codeInput">
    </div>

    <!-- 登录容器 -->
    <div class="container b-container" :class="{
      'is-txl': isLogin,
      'is-z': isLogin
    }">
      <form class="form log-position" @submit.prevent="handleLogin">
        <h2 class="form_title title">登入账号</h2>

        <div class="form_icons">
          <i class="iconfont icon-QQ"></i>
          <i class="iconfont icon-weixin"></i>
          <i class="iconfont icon-bilibili-line"></i>
        </div>



        <input v-model="loginForm.email" class="form_input" placeholder="Email" />
        <input v-model="loginForm.password" class="form_input" type="password" placeholder="Password" />

        <a class="form_link  passwordUnKnown" @click="openForgot">忘记密码？</a>
        <button :disabled="loginButton" class="button">SIGN IN</button>
      </form>
    </div>

    <!-- 切换面板 -->
    <div class="switch" :class="{
      'is-txr': isLogin,
      'is-gx': animating
    }">
      <div class="switch_circle" :class="{ 'is-txr': isLogin }"></div>
      <div class="switch_circle switch_circle-t" :class="{ 'is-txr': isLogin }"></div>

      <!-- Welcome Back -->
      <div class="switch_container" :class="{ 'is-hidden': isLogin }">
        <h2 class="switch_title title">Welcome Back!</h2>
        <p class="description">
          已经有账号了？去登入吧！
        </p>
        <button class="button" @click="changeForm">SIGN IN</button>
      </div>

      <!-- Hello Friend -->
      <div class="switch_container" :class="{ 'is-hidden': !isLogin }">
        <h2 class="switch_title title">Hello Friend!</h2>
        <p class="description">
          没有账号？去注册一个！
        </p>
        <button class="button" @click="() => { leftMode = 'register'; forgotVerify = false; changeForm() }">
          SIGN UP
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  request,
  type loginData,
  type realRegData,
  type regData,
  type forgotData,
  type realForgotData,
  setToken,
  type logFinalData,
} from '@/api'
import { addBaseMessager } from '@/models'
import router from '@/router'
//设备指纹
import { getDeviceIdSync } from '@/utils/deviceId'

/* ======================
   状态控制
====================== */
//true时为注册校验验证码的页面
const formReg = ref(false)
// 左侧面板模式：注册 or 忘记密码
const leftMode = ref<'register' | 'forgot'>('register')
// 忘记密码验证码校验页
const forgotVerify = ref(false)
//切换登录注册的动画
const isLogin = ref(true)
//切换中为true
const animating = ref(false)
//按钮(true为禁止按)
const loginButton = ref(false)
const regButton = ref(false)
//注册失败控制样式
const regBoolean = ref(false)
//注册计时器
const reSendBoolean = ref(true)
let reSendTimer: null | number = null
const countDown = ref(60)
function startCountDown() {
  //不会重启倒计时
  if (reSendTimer) return
  //开始倒计时
  reSendBoolean.value = false
  countDown.value = 60
  //启动计时器
  reSendTimer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      clearInterval(reSendTimer!)
      reSendTimer = null
      reSendBoolean.value = true
    }

  }, 1000)

}
// 表单数据
const loginForm = reactive({
  email: '',
  password: '',
})

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  confirm: '',
})

const forgotForm = reactive({
  email: '',
  password: '',
  confirm: '',
})

const code = ref('')
const focused = ref(true)
const view = ref()
const codeInput = ref()
//允许修改验证码
const changeInput = ref(true)

// 发送忘记密码验证码按钮禁用状态
const forgotSendButtonDisabled = ref(false)

const onKeydown = (e: KeyboardEvent) => {
  // 允许控制键
  if (
    e.ctrlKey ||
    e.metaKey ||
    ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
  ) {
    return
  }

  // 非数字直接阻止
  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
    return
  }

  if (code.value.length >= 6) {
    e.preventDefault()
  }
}
//同步
const onInput = async (e: Event) => {
  if (!changeInput.value) return
  if (regBoolean.value) regBoolean.value = false
  const el = e.target as HTMLInputElement
  const next = el.value

  if (!/^\d{0,6}$/.test(next)) {
    el.value = code.value
    return
  }

  //否则更新
  code.value = next
  if (code.value.length !== 6) return

  changeInput.value = false
  focused.value = false
  codeInput.value?.blur()
  //满足六个的时候直接提交检验验证码是否正确
  const regParams = { code: code.value, email: registerForm.email }
  const forgotParams = { code: code.value, email: forgotForm.email }

  // 注册验证码校验
  if (formReg.value) {
    const response = await request<realRegData>('api/realReg', 'POST', regParams, false)
    console.log(response.data)
    // 注册逻辑目前没有自动跳转，这里只让它可继续输入
    changeInput.value = true
    focused.value = true
    codeInput.value?.focus()
    switch (response.data.type) {
      case 'finallyReg':
        //注册成功
        addBaseMessager('注册成功')
        if (!isLogin.value) changeForm()
        setTimeout(() => { formReg.value = false, code.value = '' }, 500)
        break

      case 'codeFalse':
        addBaseMessager(response.data.status)
        regBoolean.value = true
        changeInput.value = true
        focused.value = true
        codeInput.value?.focus()

        break

    }
    return
  }

  // 忘记密码验证码校验
  if (forgotVerify.value) {
    const response = await request<realForgotData>('api/realForgot', 'POST', forgotParams, false)
    if (response.code !== 200 || response.data?.type !== 'finallyForgot') {
      addBaseMessager(response.data?.status || '验证码错误')
      regBoolean.value = true
      changeInput.value = true
      focused.value = true
      codeInput.value?.focus()
      return
    }

    addBaseMessager('密码重置成功，请登录')
    forgotVerify.value = false
    formReg.value = false
    leftMode.value = 'register'
    code.value = ''
    changeInput.value = true
    focused.value = true

    // 切回登录面板
    if (!isLogin.value) changeForm()
  }
}
const judgeInput = (e: PointerEvent) => {
  //不可修改或者不是验证码页面时拦截
  if (!changeInput.value || !(formReg.value || forgotVerify.value)) return
  const target = e.target as Node | null
  if (!target) return
  if (view.value && view.value.contains(target)) {
    focused.value = true
    codeInput.value?.focus()
  }
  else if (view.value && !view.value.contains(target)) {
    focused.value = false
    codeInput.value?.blur()
  }
}
onMounted(() => {
  document.addEventListener('pointerup', judgeInput)
  onBeforeUnmount(() => document.removeEventListener('pointerup', judgeInput));
})
/*
   切换动画
*/
function changeForm() {
  animating.value = true
  isLogin.value = !isLogin.value

  setTimeout(() => {
    animating.value = false
  }, 450) // 与 CSS transition 对齐
}

/*
   交互
*/
//校验
// 1. 用户名：中文、下划线、字母、数字，长度3-45
const nameReg = /^[a-zA-Z0-9_\u4e00-\u9fa5]{3,45}$/;

// 2. 密码：字母、数字与特殊字符，长度8-45
const passwordReg = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{8,45}$/;

// 3. 邮箱：最长80个字符（在原有基础上增加长度限制）
const emailReg = /^(?=.{1,80}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
//登录获取token
async function handleLogin() {
  if (loginButton.value === true) return
  loginButton.value = true
  console.log('登录数据', loginForm)


  let params = {
    email: loginForm.email,
    password: loginForm.password
  }
  if (!emailReg.test(params.email) || !passwordReg.test(params.password)) {
    addBaseMessager('邮箱或密码错误')
    loginButton.value = false
    return
  }
  const response = await request<loginData>('api/auth/login', 'POST', params, false)

  console.log(response)
  //登陆成功
  if (response.code === 200) {
    setToken(response.data.accessToken)
    //标记
    localStorage.setItem('hasRefresh', 'true')
    addBaseMessager('登录成功')
    await nextTick()
    router.push({ name: 'allRoom' })
  } else {
    addBaseMessager(response.data.status)
    loginButton.value = false
  }
}

// 忘记密码：从登录面板切换到左侧“忘记密码”面板
function openForgot() {
  leftMode.value = 'forgot'
  formReg.value = false
  forgotVerify.value = false
  code.value = ''
  changeInput.value = true
  focused.value = true
  forgotSendButtonDisabled.value = false

  // login 面板默认 isLogin=true，切到左侧需要切换一次
  if (isLogin.value) changeForm()
}

// 发送“忘记密码”验证码
async function handleForgotSendCode() {
  if (forgotSendButtonDisabled.value === true) return
  forgotSendButtonDisabled.value = true

  if (!forgotForm.email || !emailReg.test(forgotForm.email)) {
    addBaseMessager('邮箱非法')
    forgotSendButtonDisabled.value = false
    return
  }
  if (!forgotForm.password || !passwordReg.test(forgotForm.password)) {
    addBaseMessager('密码仅支持字母、数字与特殊字符，长度8-45')
    forgotSendButtonDisabled.value = false
    return
  }
  if (forgotForm.password !== forgotForm.confirm) {
    addBaseMessager('两次密码不一致')
    forgotSendButtonDisabled.value = false
    return
  }

  const params = {
    email: forgotForm.email,
    password: forgotForm.password,
    deviceId: getDeviceIdSync()
  }

  const response = await request<forgotData>('api/forgot', 'POST', params, false)
  switch (response.data?.type) {
    case 'forgotaccess':
      startCountDown()
      addBaseMessager('验证码已发送')
      forgotVerify.value = true
      code.value = ''
      changeInput.value = true
      focused.value = true
      await nextTick()
      codeInput.value?.focus()
      forgotSendButtonDisabled.value = false
      break
    default:
      addBaseMessager(response.data?.status || '发送失败')
      forgotSendButtonDisabled.value = false
      break
  }
}
//确认注册     发送 验证码
async function handleRegister() {
  if (regButton.value === true) return
  regButton.value = true
  console.log('注册数据', registerForm)
  //校验
  if (!registerForm.email || !registerForm.name || !registerForm.password || !registerForm.confirm) {
    addBaseMessager('不能为空')
    regButton.value = false
    return
  }
  //
  if (!nameReg.test(registerForm.name)) {
    addBaseMessager('用户名仅支持中文、下划线、字母、数字，长度3-45')
    regButton.value = false
    return
  }

  if (!emailReg.test(registerForm.email)) {
    addBaseMessager('邮箱非法')
    regButton.value = false
    return
  }
  if (registerForm.password !== registerForm.confirm) {
    addBaseMessager('两次密码不一致')
    regButton.value = false
    return
  }
  if (!passwordReg.test(registerForm.password)) {
    addBaseMessager('密码仅支持字母、数字与特殊字符，长度8-45')
    regButton.value = false
    return
  }



  let params = {
    name: registerForm.name,
    email: registerForm.email,
    password: registerForm.password,
    deviceId: getDeviceIdSync()
  }

  const response = await request<regData>('api/reg', 'POST', params, false)
  console.log(response.data)
  switch (response.data.type) {
    //成功时
    case 'regaccess':
      //切换下个页面
      startCountDown()
      formReg.value = true
      code.value = ''
      addBaseMessager('验证码已发送')
      //按钮可用
      setTimeout(() => {
        regButton.value = false
      }, 500)
      break;

    default:
      addBaseMessager(response.data.status)
      regButton.value = false
      break;
  }

}


async function reSendCode() {
  if (!reSendBoolean.value || reSendTimer) return
  startCountDown()
  if (formReg.value) {
    await handleRegister()
  } else {
    await handleForgotSendCode()
  }

}
function goBack() {

  if (formReg.value) {
    formReg.value = false
    //若在注册页面
  } else {
    forgotVerify.value = false
    //若在忘记页面
  }


}
//检测是否有refreshtoken
onMounted(async () => {
  if (localStorage.getItem('hasRefresh') === 'true') {
    //登录请求
    const res = await request<logFinalData>('api/auth/tokenLogin', 'GET', {}, false)
    console.log(res)
    if (res.code === 200) {
      router.push({ name: 'allRoom' })
    }
  }
})
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

/* ================= 表单容器 ================= */

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

/* ================= 表单 ================= */

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

.log-position {
  left: 0px;
}

.form_icons {
  margin: 10px 0;
}

.form_span {
  margin-top: 20px;
  margin-bottom: 12px;
  font-size: 13px;
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

/* ================= 标题 ================= */

.title {
  font-size: 34px;
  font-weight: 700;
  color: #181818;
  letter-spacing: 6px;
  white-space: nowrap;
}

/* 只修正 switch 面板中的标题间距 */
.switch_container .title {
  line-height: 1.15;
  margin-bottom: 12px;
  letter-spacing: 0;
}

/* ================= 描述 ================= */

.description {
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

/* ================= 按钮 ================= */

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

.button:hover {
  transform: scale(0.985);
}

.button:active {
  transform: scale(0.97);
}

.button:disabled {
  background-color: #cccccc;
  /* 灰色背景 */
  color: #666666;
  /* 灰色文字 */
  cursor: not-allowed;
  /* 禁用光标 */
  box-shadow: none;
  /* 去掉阴影效果 */
}

/* ================= 切换面板 ================= */

.switch {
  position: absolute;
  top: 0;
  left: 0;
  width: 480px;
  height: 100%;
  padding: 50px;
  background-color: #ecf0f3;
  z-index: 200;
  overflow: hidden;
  box-shadow: 4px 4px 10px #d1d9e6,
    -4px -4px 10px #d1d9e6;
  transition: 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ================= 圆形装饰 ================= */

.switch_circle {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background-color: #ecf0f3;
  bottom: -60%;
  left: -60%;
  box-shadow: inset 8px 8px 12px #bec7c7,
    inset -8px -8px 12px #f9f9f9;
  transition: 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch_circle-t {
  top: -30%;
  left: 60%;
  width: 300px;
  height: 300px;
}

/* ================= 状态类（核心） ================= */

.is-hidden {
  opacity: 0;
  visibility: hidden;
  position: absolute;
}

.is-txr {
  left: calc(100% - 408px);
}

.is-txl {
  left: 0;
}

.is-z {
  z-index: 200 !important;
}

.is-gx {
  animation: is-gx 0.8s;
}


/*   code-box */
.code-box {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  background-color: #ecf0f3;
}

.code-input {
  position: absolute;
  left: 100px;
  z-index: -9;
}

.code-view {
  width: 350px;
  height: 50px;
  position: absolute;
  left: 144px;
  top: 220px;
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
  color: #3F86FF;

}

.passwordUnKnown {
  cursor: pointer
}

.codeActive {
  border: 2px solid #3F86FF;
}

.regFalse {
  border: 2px solid #ff1f1f;
  color: #ff1f1f;
}

.codeTitle {
  text-align: center;
  padding-left: 90px;
  padding-top: 60px;
}

/* 发送验证码按钮 */
.reSend-btn {
  position: relative;
  left: -120px;
  top: 120px;
  background-color: #ecf0f3;
  border: none;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  color: #3F86FF;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.08),
    -4px -4px 8px rgba(255, 255, 255, 0.6);
}

/* 禁用状态 */
.reSend-btn:disabled {
  color: #999;
  cursor: default;
  box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.08),
    inset -2px -2px 5px rgba(255, 255, 255, 0.6);
}

/* 倒计时文字 */
.count-text {
  margin-left: 4px;
  color: #888;
  font-size: 13px;
}

.goBack {
  display: inline-block;
  position: relative;
  left: 520px;
  top: -111px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666;
}

/* ================= 动画 ================= */

@keyframes is-gx {

  0%,
  100% {
    width: 480px;
  }

  50% {
    width: 500px;
  }
}
</style>
