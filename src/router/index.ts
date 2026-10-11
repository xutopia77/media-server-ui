import { createRouter, createWebHashHistory } from 'vue-router'
import AppEntry from '@/components/AppEntry.vue'
import MediaEntry from '@/components/media/MediaEntry.vue'
import GbEntry from '@/components/gb/GbEntry.vue'
import GbDeviceEntry from '@/components/gb-device/GbDeviceEntry.vue'
import FlvEntry from '@/components/flv/flvEntry.vue'
import AdminEntry from '@/components/admin/AdminEntry.vue'
import AboutEntry from '@/components/about/AboutEntry.vue'
import DebugPage from '@/components/DebugPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
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
      path: '/admin',
      name: 'admin',
      component: AdminEntry
    },
    {
      path: '/debug',
      name: 'debug',
      component: DebugPage
    },
    {
      path: '/about',
      name: 'about',
      component: AboutEntry
    }
  ]
})

export default router
