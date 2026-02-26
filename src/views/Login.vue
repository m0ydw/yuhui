<template>
  <div class="shell">
    <!-- 注册容器 -->
    <div class="container a-container" :class="{ 'is-txl': isLogin }">
      <form class="form" @submit.prevent="handleRegister" v-if="!formReg">
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
      <div class="code-box" v-if="formReg">
        <div class="code-view" @click="" ref="view">
          <div class="code-item" v-for="(item, idx) in 6" :key="idx"
            :class="{ codeActive: idx === code.length && focused }">
            {{ code[idx] || '' }}
          </div>
        </div>

        <input type="text" class="code-input" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code"
          @keydown="onKeydown" @paste.prevent @input="onInput" ref="codeInput">
      </div>
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

        <a class="form_link">忘记密码？</a>
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
        <button class="button" @click="changeForm">SIGN UP</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { request, type loginData, type realRegData, type regData, setToken, type logFinalData } from '@/api'
import { addBaseMessager } from '@/models'
import router from '@/router'

/* ======================
   状态控制
====================== */
//true时为校验验证码的页面
const formReg = ref(false)
//切换登录注册的动画
const isLogin = ref(true)
//切换中为true
const animating = ref(false)
//按钮(true为禁止按)
const loginButton = ref(false)
const regButton = ref(false)


// 表单数据
const loginForm = reactive({
  email: '',
  password: '',
})

const registerForm = reactive({
  name: '111111',
  email: '3181001076@qq.com',
  password: '11111111111',
  confirm: '11111111111',
})

const code = ref('')
const focused = ref(true)
const view = ref()
const codeInput = ref()
//允许修改验证码
const changeInput = ref(true)

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
  let params = { code: code.value, email: registerForm.email }
  const response = await request<realRegData>('api/realReg', 'POST', params, false)
  console.log(response.data)
}
const judgeInput = (e: PointerEvent) => {
  //不可修改或者不是验证码页面时拦截
  if (!changeInput.value || !formReg.value) return
  const target = e.target as Node | null
  if (!target) return
  if (view.value.contains(target)) {
    focused.value = true
    codeInput.value?.focus()
  }
  else if (!view.value.contains(target)) {
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
//获取token
async function handleLogin() {
  if (loginButton.value === true) return
  loginButton.value = true
  console.log('登录数据', loginForm)

  // TODO: 在这里接你的登录接口
  // await api.login(loginForm)

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
  //登陆成功
  console.log(response)
  if (response.code === 400) {
    setToken(response.data.accessToken)
    //标记
    localStorage.setItem('hasRefresh', 'true')
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
    password: registerForm.password
  }

  const response = await request<regData>('api/reg', 'POST', params, false)

  console.log(response.data)
  switch (response.data.type) {
    //成功时
    case 'regaccess':
      //切换下个页面
      formReg.value = true
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
//检测是否有refreshtoken
onMounted(async () => {
  if (localStorage.getItem('hasRefresh') === 'true') {
    //登录请求
    const res = await request<logFinalData>('api/auth/tokenLogin', 'GET', {}, false)
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
  background-color: #4878e2;
  width: 100%;
  height: 100%;
  position: relative
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
  color: #3F86FF;

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
