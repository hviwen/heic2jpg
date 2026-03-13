<script setup lang="ts">
import { RouterView } from 'vue-router'
import { computed, onMounted } from 'vue'
import {
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NLayout,
  NLayoutContent,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateEnUS,
  dateZhCN,
  enUS,
  type GlobalThemeOverrides,
  zhCN
} from 'naive-ui'
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import { usePreferencesStore } from './stores/preferences'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()

const naiveTheme = computed(() => (themeStore.currentTheme === 'dark' ? darkTheme : null))
const naiveLocale = computed(() => (preferencesStore.language === 'zh-CN' ? zhCN : enUS))
const naiveDateLocale = computed(() => (preferencesStore.language === 'zh-CN' ? dateZhCN : dateEnUS))

const themeOverrides = computed<GlobalThemeOverrides>(() => ({
  common: {
    primaryColor: '#2d6a4f',
    primaryColorHover: '#24563f',
    primaryColorPressed: '#1f4a37',
    primaryColorSuppl: '#417c60',
    infoColor: '#3c5c7a',
    successColor: '#2d6a4f',
    warningColor: '#b26d33',
    errorColor: '#b34a3c',
    borderRadius: '22px',
    borderRadiusSmall: '14px',
    fontFamily: '"Manrope", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontFamilyMono: '"IBM Plex Mono", monospace',
    bodyColor: themeStore.currentTheme === 'dark' ? '#111512' : '#f5f1e8',
    cardColor: themeStore.currentTheme === 'dark' ? '#171d19' : '#fffdf8',
    modalColor: themeStore.currentTheme === 'dark' ? '#171d19' : '#fffdf8',
    popoverColor: themeStore.currentTheme === 'dark' ? '#1b231d' : '#fffdf8',
    tableColor: themeStore.currentTheme === 'dark' ? '#171d19' : '#fffdf8',
    textColorBase: themeStore.currentTheme === 'dark' ? '#f2ede2' : '#1d241f',
    textColor1: themeStore.currentTheme === 'dark' ? '#f2ede2' : '#1d241f',
    textColor2: themeStore.currentTheme === 'dark' ? '#d0c8b7' : '#465247',
    textColor3: themeStore.currentTheme === 'dark' ? '#9fad9f' : '#667369',
    placeholderColor: themeStore.currentTheme === 'dark' ? '#7f8b81' : '#78867b',
    borderColor: themeStore.currentTheme === 'dark' ? '#2a342d' : '#d9d2c3',
    dividerColor: themeStore.currentTheme === 'dark' ? '#2a342d' : '#e4ded1',
    codeColor: themeStore.currentTheme === 'dark' ? '#0f1511' : '#f3eee2'
  },
  Button: {
    fontWeight: '700'
  },
  Card: {
    borderRadius: '28px'
  },
  Input: {
    borderRadius: '18px'
  }
}))

onMounted(() => {
  themeStore.initTheme()
  preferencesStore.initPreferences()
  void authStore.fetchSession()
})
</script>

<template>
  <NConfigProvider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
  >
    <NGlobalStyle />
    <NDialogProvider>
      <NNotificationProvider>
        <NMessageProvider>
          <NLayout embedded position="absolute" class="app-shell">
            <AppHeader />
            <NLayoutContent content-style="padding: 0;">
              <main class="app-main">
                <RouterView v-slot="{ Component }">
                  <Transition name="page-shift" mode="out-in">
                    <component :is="Component" />
                  </Transition>
                </RouterView>
              </main>
            </NLayoutContent>
            <AppFooter />
          </NLayout>
        </NMessageProvider>
      </NNotificationProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(201, 163, 92, 0.16), transparent 35%),
    radial-gradient(circle at top right, rgba(45, 106, 79, 0.15), transparent 28%),
    linear-gradient(180deg, rgba(255, 253, 248, 0.92), rgba(245, 241, 232, 0.98));
}

:global(.dark) .app-shell {
  background:
    radial-gradient(circle at top left, rgba(189, 138, 61, 0.14), transparent 32%),
    radial-gradient(circle at top right, rgba(45, 106, 79, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(17, 21, 18, 0.98), rgba(12, 16, 13, 1));
}

.app-main {
  width: min(1380px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 56px;
}

.page-shift-enter-active,
.page-shift-leave-active {
  transition:
    opacity 260ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.page-shift-enter-from,
.page-shift-leave-to {
  opacity: 0;
  transform: translateY(14px);
}

@media (max-width: 768px) {
  .app-main {
    width: min(100vw - 20px, 100%);
    padding-top: 16px;
    padding-bottom: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-shift-enter-active,
  .page-shift-leave-active {
    transition: none;
  }
}
</style>
