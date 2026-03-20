import { createRouter, createWebHistory } from 'vue-router'
import AppEntry from '@/components/AppEntry.vue'
import FlvEntry from '@/components/flv/flvEntry.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AppEntry
    },
    {
      path: '/flv',
      name: 'flv',
      component: FlvEntry
    }
  ]
})

export default router
