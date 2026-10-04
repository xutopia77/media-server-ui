<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <n-global-style />
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <n-layout position="absolute">
            <n-layout-header bordered class="app-header">
              <NavBar />
            </n-layout-header>
            <n-layout-content position="absolute" class="app-content">
              <router-view />
            </n-layout-content>
          </n-layout>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import NavBar from '@/components/NavBar.vue'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#0e639c',
    primaryColorHover: '#1177bb',
    primaryColorPressed: '#0b4d7c'
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  height: 100vh;
}

.app-header {
  height: 60px;
}

.app-content {
  top: 60px;
}
</style>
