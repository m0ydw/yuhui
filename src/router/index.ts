import { createRouter, createWebHistory, type LocationQueryValue } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: '/allRoom',
      name: 'allRoom',
      component: () => import('../views/allRoom.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

export default router
