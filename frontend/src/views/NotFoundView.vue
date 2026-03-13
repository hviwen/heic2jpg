<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, NCard } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <NCard embedded :bordered="false" class="studio-panel not-found-shell studio-dot-grid">
    <div class="studio-label">404</div>
    <h1 class="studio-display mt-3 text-5xl font-semibold">{{ t('notFound.title') }}</h1>
    <p class="mt-4 max-w-2xl text-sm leading-7 text-[var(--studio-muted)] md:text-base">
      {{ t('notFound.description') }}
    </p>
    <NButton class="mt-6" type="primary" @click="router.push('/')">{{ t('common.backHome') }}</NButton>
  </NCard>
</template>

<style scoped>
.not-found-shell {
  border-radius: 32px;
  padding: 24px;
}
</style>
