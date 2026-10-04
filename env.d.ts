/// <reference types="vite/client" />

// Global components registered via app.use(naive-ui)
import type { GlobalComponents } from 'naive-ui'

declare module 'vue' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- re-export naive-ui global component types
  interface GlobalComponents extends GlobalComponents {}
}

