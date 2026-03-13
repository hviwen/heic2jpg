<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NAvatar,
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NDropdown,
  NIcon,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui'
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ClockIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  HomeIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  SunIcon,
  MoonIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '../../stores/theme'
import { useConversionStore } from '../../stores/conversion'
import { useAuthStore } from '../../stores/auth'
import { usePreferencesStore } from '../../stores/preferences'
import type { AppLocale } from '../../i18n/messages'

const router = useRouter()
const { t } = useI18n()
const themeStore = useThemeStore()
const conversionStore = useConversionStore()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()

const drawerVisible = ref(false)

const navItems = computed(() => [
  { key: '/', label: t('nav.home'), icon: HomeIcon },
  { key: '/history', label: t('nav.history'), icon: ClockIcon },
  { key: '/settings', label: t('nav.settings'), icon: Cog6ToothIcon },
  { key: '/about', label: t('nav.about'), icon: QuestionMarkCircleIcon }
])

const currentPath = computed(() => router.currentRoute.value.path)
const userInitial = computed(() => authStore.user?.name?.slice(0, 1).toUpperCase() || 'U')

const themeOptions = computed(() => [
  { label: t('common.light'), value: 'light' },
  { label: t('common.dark'), value: 'dark' },
  { label: t('common.auto'), value: 'auto' }
])

const languageOptions = computed(() => [
  { label: t('common.chinese'), value: 'zh-CN' },
  { label: t('common.english'), value: 'en-US' }
])

const accountOptions = computed(() => [
  {
    label: t('common.signOut'),
    key: 'logout',
    icon: () =>
      h(
        NIcon,
        null,
        {
          default: () => h(ArrowLeftOnRectangleIcon)
        }
      )
  }
])

const navigateTo = (path: string) => {
  void router.push(path)
  drawerVisible.value = false
}

const startNewConversion = () => {
  if (conversionStore.tasks.length > 0) {
    conversionStore.clearAllFiles()
  }
  navigateTo('/')
}

const handleThemeChange = (value: string) => {
  if (value === 'light' || value === 'dark' || value === 'auto') {
    themeStore.setTheme(value)
  }
}

const handleLanguageChange = (value: string) => {
  if (value === 'zh-CN' || value === 'en-US') {
    preferencesStore.setLanguage(value as AppLocale)
  }
}

const handleAccountSelect = async (key: string) => {
  if (key === 'logout') {
    await authStore.logout()
  }
}

const handleLogin = () => {
  authStore.startGoogleLogin()
}

const iconForTheme = computed(() => {
  if (themeStore.theme === 'dark') return MoonIcon
  if (themeStore.theme === 'light') return SunIcon
  return ComputerDesktopIcon
})
</script>

<template>
  <header class="sticky top-0 z-50 px-3 pt-3 md:px-4 md:pt-4">
    <NCard embedded :bordered="false" class="studio-panel app-header">
      <div class="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <button class="min-w-0 text-left" @click="navigateTo('/')">
          <div class="flex items-center gap-3">
            <div class="header-mark studio-dot-grid">
              <div class="header-mark__inner"></div>
            </div>
            <div class="min-w-0">
              <div class="studio-label">{{ t('home.eyebrow') }}</div>
              <div class="truncate text-base font-extrabold tracking-tight md:text-lg">
                {{ t('app.name') }}
              </div>
            </div>
          </div>
        </button>

        <nav class="hidden items-center gap-1 lg:flex">
          <NButton
            v-for="item in navItems"
            :key="item.key"
            quaternary
            round
            strong
            class="nav-pill"
            :class="{ 'nav-pill--active': currentPath === item.key }"
            @click="navigateTo(item.key)"
          >
            <template #icon>
              <NIcon><component :is="item.icon" /></NIcon>
            </template>
            {{ item.label }}
          </NButton>
        </nav>

        <div class="hidden items-center gap-2 lg:flex">
          <NButton tertiary strong type="primary" round class="action-pill" @click="startNewConversion">
            <template #icon>
              <NIcon><PlusIcon /></NIcon>
            </template>
            {{ t('nav.newConversion') }}
          </NButton>

          <NTag v-if="conversionStore.isProcessing" round type="warning" :bordered="false">
            {{ t('common.processing') }}
          </NTag>
          <NTag v-else-if="!authStore.oauthEnabled" round :bordered="false">
            {{ t('common.anonymous') }}
          </NTag>

          <NSelect
            size="small"
            class="w-[108px]"
            :value="themeStore.theme"
            :options="themeOptions"
            @update:value="handleThemeChange"
          />
          <NSelect
            size="small"
            class="w-[112px]"
            :value="preferencesStore.language"
            :options="languageOptions"
            @update:value="handleLanguageChange"
          />

          <NButton
            v-if="authStore.oauthEnabled && !authStore.isAuthenticated"
            strong
            secondary
            round
            @click="handleLogin"
          >
            <template #icon>
              <NIcon><ArrowRightOnRectangleIcon /></NIcon>
            </template>
            {{ t('common.signIn') }}
          </NButton>

          <NDropdown
            v-else-if="authStore.isAuthenticated"
            trigger="click"
            :options="accountOptions"
            @select="handleAccountSelect"
          >
            <button class="account-chip">
              <NAvatar
                round
                size="small"
                :src="authStore.user?.avatarUrl ?? undefined"
                :fallback-src="undefined"
              >
                {{ userInitial }}
              </NAvatar>
              <div class="min-w-0 text-left">
                <div class="truncate text-sm font-semibold">{{ authStore.user?.name }}</div>
                <div class="truncate text-xs opacity-70">{{ authStore.user?.email }}</div>
              </div>
            </button>
          </NDropdown>
        </div>

        <div class="flex items-center gap-2 lg:hidden">
          <NButton quaternary circle @click="handleThemeChange(themeStore.theme === 'auto' ? 'dark' : themeStore.theme === 'dark' ? 'light' : 'auto')">
            <template #icon>
              <NIcon><component :is="iconForTheme" /></NIcon>
            </template>
          </NButton>
          <NButton quaternary circle @click="drawerVisible = true">
            <template #icon>
              <NIcon><Bars3Icon /></NIcon>
            </template>
          </NButton>
        </div>
      </div>
    </NCard>

    <NDrawer v-model:show="drawerVisible" placement="right" width="min(88vw, 360px)">
      <NDrawerContent closable>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="header-mark header-mark--small">
              <div class="header-mark__inner"></div>
            </div>
            <div>
              <div class="studio-label">{{ t('app.name') }}</div>
              <div class="text-sm text-[var(--studio-muted)]">{{ t('app.tagline') }}</div>
            </div>
          </div>
        </template>

        <div class="space-y-5">
          <div class="space-y-2">
            <NButton
              v-for="item in navItems"
              :key="item.key"
              block
              size="large"
              :type="currentPath === item.key ? 'primary' : 'default'"
              :secondary="currentPath !== item.key"
              class="justify-start"
              @click="navigateTo(item.key)"
            >
              <template #icon>
                <NIcon><component :is="item.icon" /></NIcon>
              </template>
              {{ item.label }}
            </NButton>
          </div>

          <NCard size="small" embedded :bordered="false" class="studio-panel">
            <NSpace vertical :size="12">
              <div class="studio-label">{{ t('common.theme') }}</div>
              <NSelect :value="themeStore.theme" :options="themeOptions" @update:value="handleThemeChange" />
              <div class="studio-label">{{ t('common.language') }}</div>
              <NSelect :value="preferencesStore.language" :options="languageOptions" @update:value="handleLanguageChange" />
            </NSpace>
          </NCard>

          <NButton block strong tertiary type="primary" @click="startNewConversion">
            <template #icon>
              <NIcon><PlusIcon /></NIcon>
            </template>
            {{ t('nav.newConversion') }}
          </NButton>

          <NCard size="small" embedded :bordered="false" class="studio-panel">
            <div v-if="authStore.isAuthenticated" class="space-y-3">
              <div class="flex items-center gap-3">
                <NAvatar round :src="authStore.user?.avatarUrl ?? undefined">
                  {{ userInitial }}
                </NAvatar>
                <div class="min-w-0">
                  <div class="truncate font-semibold">{{ authStore.user?.name }}</div>
                  <div class="truncate text-sm text-[var(--studio-muted)]">{{ authStore.user?.email }}</div>
                </div>
              </div>
              <div class="text-sm text-[var(--studio-muted)]">{{ t('auth.ready') }}</div>
              <NButton block secondary @click="handleAccountSelect('logout')">
                <template #icon>
                  <NIcon><ArrowLeftOnRectangleIcon /></NIcon>
                </template>
                {{ t('common.signOut') }}
              </NButton>
            </div>
            <div v-else class="space-y-3">
              <NTag v-if="!authStore.oauthEnabled" :bordered="false">{{ t('common.anonymous') }}</NTag>
              <div class="text-sm text-[var(--studio-muted)]">{{ t('auth.ready') }}</div>
              <NButton v-if="authStore.oauthEnabled" block type="primary" @click="handleLogin">
                <template #icon>
                  <NIcon><ArrowRightOnRectangleIcon /></NIcon>
                </template>
                {{ t('common.signIn') }}
              </NButton>
            </div>
          </NCard>
        </div>
      </NDrawerContent>
    </NDrawer>
  </header>
</template>

<style scoped>
.app-header {
  border-radius: 28px;
}

.header-mark {
  display: flex;
  height: 48px;
  width: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid var(--studio-line);
  background:
    radial-gradient(circle at top right, rgba(178, 109, 51, 0.24), transparent 40%),
    color-mix(in srgb, var(--studio-accent) 12%, var(--studio-card));
}

.header-mark--small {
  height: 40px;
  width: 40px;
  border-radius: 14px;
}

.header-mark__inner {
  height: 22px;
  width: 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--studio-warm), var(--studio-accent));
  box-shadow: 0 10px 20px rgba(45, 106, 79, 0.22);
}

.nav-pill {
  color: var(--studio-muted);
}

.nav-pill--active {
  background: color-mix(in srgb, var(--studio-accent) 12%, var(--studio-card));
  color: var(--studio-ink);
}

.action-pill {
  min-width: 136px;
}

.account-chip {
  display: flex;
  max-width: 240px;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--studio-line);
  border-radius: 999px;
  background: transparent;
  padding: 6px 10px 6px 6px;
  color: inherit;
}

@media (max-width: 1024px) {
  .app-header {
    border-radius: 24px;
  }
}
</style>
