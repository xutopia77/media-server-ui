import { createRouter, createWebHistory } from 'vue-router'
import AppEntry from '@/components/AppEntry.vue'
import MediaEntry from '@/components/media/MediaEntry.vue'
import GbEntry from '@/components/gb/GbEntry.vue'
import GbDeviceEntry from '@/components/gb-device/GbDeviceEntry.vue'
import FlvEntry from '@/components/flv/flvEntry.vue'
import AboutEntry from '@/components/about/AboutEntry.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: AppEntry
    },
    {
      path: '/media',
      name: 'media',
      component: MediaEntry
    },
    {
      path: '/gb',
      name: 'gb',
      component: GbEntry
    },
    {
      path: '/gb-device',
      name: 'gb-device',
      component: GbDeviceEntry
    },
    {
      path: '/flv',
      name: 'flv',
      component: FlvEntry
    },
    {
      path: '/about',
      name: 'about',
      component: AboutEntry
    }
  ]
})

export default router
