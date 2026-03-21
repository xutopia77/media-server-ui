<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1>Media Server</h1>
      </div>
      <ul class="navbar-menu">
        <li v-for="item in menuItems" :key="item.path" class="navbar-item">
          <router-link :to="item.path" class="navbar-link" :class="{ active: isActive(item.path) }">
            {{ item.name }}
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

interface MenuItem {
  name: string
  path: string
}

const menuItems: MenuItem[] = [
  { name: 'Home', path: '/' },
  { name: 'Media', path: '/media' },
  { name: 'GB', path: '/gb' },
  { name: 'GB Device', path: '/gb-device' },
  { name: 'FLV Player', path: '/flv' },
  { name: 'About', path: '/about' },
]

const isActive = (path: string) => {
  return route.path === path
}
</script>

<style scoped>
.navbar {
  background-color: #252526;
  border-bottom: 1px solid #3c3c3c;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.navbar-brand h1 {
  font-size: 20px;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.5px;
}

.navbar-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 5px;
}

.navbar-item {
  margin: 0;
}

.navbar-link {
  display: block;
  padding: 10px 16px;
  color: #cccccc;
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  border-radius: 2px;
  transition: all 0.15s;
  position: relative;
  white-space: nowrap;
}

.navbar-link:hover {
  background-color: #3c3c3c;
  color: #ffffff;
}

.navbar-link.active {
  color: #ffffff;
  font-weight: 500;
}

.navbar-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #0e639c;
}
</style>
