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
    bodyColor: themeStore.currentTheme === 'dark' ? '#111713' : '#edf2e7',
    cardColor: themeStore.currentTheme === 'dark' ? '#151d17' : '#fafcf7',
    modalColor: themeStore.currentTheme === 'dark' ? '#151d17' : '#fafcf7',
    popoverColor: themeStore.currentTheme === 'dark' ? '#19231b' : '#fafcf7',
    tableColor: themeStore.currentTheme === 'dark' ? '#151d17' : '#fafcf7',
    textColorBase: themeStore.currentTheme === 'dark' ? '#edf2e7' : '#1b231d',
    textColor1: themeStore.currentTheme === 'dark' ? '#edf2e7' : '#1b231d',
    textColor2: themeStore.currentTheme === 'dark' ? '#cdd8cc' : '#455545',
    textColor3: themeStore.currentTheme === 'dark' ? '#9fb09f' : '#647564',
    placeholderColor: themeStore.currentTheme === 'dark' ? '#7b8c7d' : '#788878',
    borderColor: themeStore.currentTheme === 'dark' ? '#27332b' : '#ced8c8',
    dividerColor: themeStore.currentTheme === 'dark' ? '#27332b' : '#dce5d7',
    codeColor: themeStore.currentTheme === 'dark' ? '#0f1511' : '#f0f5eb'
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
          <NLayout embedded position="absolute" class="app-shell app-theme-transition">
            <AppHeader class="app-header" />
            <NLayoutContent content-style="padding: 0;" class="app-content">
              <main class="app-main">
                <RouterView v-slot="{ Component }">
                  <Transition name="page-shift" mode="out-in">
                    <component :is="Component" />
                  </Transition>
                </RouterView>
              </main>
            </NLayoutContent>
            <AppFooter class="app-footer" />
          </NLayout>
        </NMessageProvider>
      </NNotificationProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--studio-body);
  display: flex;
  flex-direction: column;
}

.app-theme-transition {
  transition: background 0.3s ease;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-content {
  min-height: calc(100vh - 120px);
  padding: 0;
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
