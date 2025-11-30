import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/allRoom',
    },
    {
      path: '/draw',
      name: 'draw',
      component: () => import('../views/Board.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
    },
    {
      path: '/allRoom',
      name: 'allRoom',
      component: () => import('../views/allRoom.vue'),
    },
  ],
})

export default router
