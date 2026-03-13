import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import './assets/css/main.css'

// 全局错误处理
const handleError = (error: unknown) => {
  console.error('Global error:', error)
  // 这里可以集成错误报告服务
}

// 创建应用
const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (error) => {
  handleError(error)
}
window.onerror = (eventOrMessage, source, lineno, colno, error) => {
  handleError(error ?? eventOrMessage)
  return false
}
window.onunhandledrejection = (event) => {
  handleError(event.reason)
}

// 使用插件
app.use(createPinia())
app.use(router)
app.use(i18n)

// 挂载应用
app.mount('#app')

// 开发工具
if (import.meta.env.DEV) {
  // @ts-expect-error window property
  window.__VUE_APP__ = app
}
