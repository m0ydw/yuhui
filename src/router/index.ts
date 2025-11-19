import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/draw',
      component: () => import('../components/mainBoard.vue'),
    },
  ],
})

export default router
