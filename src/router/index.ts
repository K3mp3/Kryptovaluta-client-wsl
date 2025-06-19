import HomeView from '@/views/HomeView.vue'
import LandingView from '@/views/LandingView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing page',
      component: LandingView,
    },
    {
      path: '/user-home',
      name: 'home page',
      component: HomeView,
    },
  ],
})

export default router
