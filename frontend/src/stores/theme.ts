import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const theme = ref<'light' | 'dark' | 'auto'>('auto')
  const systemTheme = ref<'light' | 'dark'>('light')
  const currentTheme = ref<'light' | 'dark'>('light')

  // 初始化主题
  const initTheme = () => {
    // 检测系统主题
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemTheme.value = darkModeMediaQuery.matches ? 'dark' : 'light'
    
    // 监听系统主题变化
    darkModeMediaQuery.addEventListener('change', (e) => {
      systemTheme.value = e.matches ? 'dark' : 'light'
      updateCurrentTheme()
    })

    // 从本地存储读取用户偏好
    const savedTheme = localStorage.getItem('heic2jpg-theme') as 'light' | 'dark' | 'auto' | null
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      theme.value = savedTheme
    }

    updateCurrentTheme()
  }

  // 更新当前应用的主题
  const updateCurrentTheme = () => {
    let newTheme: 'light' | 'dark'
    
    if (theme.value === 'auto') {
      newTheme = systemTheme.value
    } else {
      newTheme = theme.value
    }

    if (currentTheme.value !== newTheme) {
      currentTheme.value = newTheme
      applyThemeToDOM(newTheme)
    }
  }

  // 应用主题到DOM
  const applyThemeToDOM = (theme: 'light' | 'dark') => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }

    // 设置meta theme-color
    const themeColor = theme === 'dark' ? '#0f172a' : '#ffffff'
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.setAttribute('content', themeColor)
  }

  // 切换主题
  const toggleTheme = () => {
    if (theme.value === 'auto') {
      theme.value = 'dark'
    } else if (theme.value === 'dark') {
      theme.value = 'light'
    } else {
      theme.value = 'auto'
    }
    
    saveTheme()
    updateCurrentTheme()
  }

  // 设置主题
  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    if (['light', 'dark', 'auto'].includes(newTheme)) {
      theme.value = newTheme
      saveTheme()
      updateCurrentTheme()
    }
  }

  // 保存主题到本地存储
  const saveTheme = () => {
    localStorage.setItem('heic2jpg-theme', theme.value)
  }

  // 获取主题图标
  const getThemeIcon = () => {
    switch (theme.value) {
      case 'light':
        return 'sun'
      case 'dark':
        return 'moon'
      case 'auto':
        return 'computer-desktop'
      default:
        return 'sun'
    }
  }

  // 获取主题标签
  const getThemeLabel = () => {
    switch (theme.value) {
      case 'light':
        return '浅色模式'
      case 'dark':
        return '深色模式'
      case 'auto':
        return '跟随系统'
      default:
        return '跟随系统'
    }
  }

  // 监听主题变化
  watch(theme, updateCurrentTheme)
  watch(systemTheme, updateCurrentTheme)

  return {
    // 状态
    theme,
    systemTheme,
    currentTheme,
    
    // 方法
    initTheme,
    toggleTheme,
    setTheme,
    getThemeIcon,
    getThemeLabel,
    
    // 计算属性
    isDark: () => currentTheme.value === 'dark',
    isLight: () => currentTheme.value === 'light',
    isAuto: () => theme.value === 'auto'
  }
})