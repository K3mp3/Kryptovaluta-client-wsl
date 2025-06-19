import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LandingView from '@/views/LandingView.vue'
import { isAuthenticated } from './auth'


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
      meta: { requiresAuth: true }
    },
  ],
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ path: '/' })
  } else {
    next()
  }
})

export default router
