<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NCollapse, NCollapseItem } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

const faqItems = computed(() => tm('about.faq') as Array<{ question: string; answer: string }>)
const principles = computed(() => tm('about.principles') as string[])
</script>

<template>
  <div class="space-y-6">
    <NCard embedded :bordered="false" class="studio-panel help-shell">
      <div class="studio-label">{{ t('nav.about') }}</div>
      <h1 class="studio-display mt-3 text-4xl font-semibold">{{ t('about.pageTitle') }}</h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-[var(--studio-muted)] md:text-base">
        {{ t('about.pageDescription') }}
      </p>
    </NCard>

    <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <NCard embedded :bordered="false" class="studio-panel help-shell">
        <div class="studio-label">{{ t('about.faqTitle') }}</div>
        <NCollapse accordion class="mt-4">
          <NCollapseItem
            v-for="item in faqItems"
            :key="item.question"
            :title="item.question"
            :name="item.question"
          >
            {{ item.answer }}
          </NCollapseItem>
        </NCollapse>
      </NCard>

      <NCard embedded :bordered="false" class="studio-panel help-shell studio-dot-grid">
        <div class="studio-label">{{ t('about.principlesTitle') }}</div>
        <ul class="mt-4 space-y-4">
          <li v-for="principle in principles" :key="principle" class="principle-item">
            {{ principle }}
          </li>
        </ul>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.help-shell {
  border-radius: 32px;
  padding: 24px;
}

.principle-item {
  position: relative;
  padding-left: 18px;
  line-height: 1.9;
  color: var(--studio-muted);
}

.principle-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  height: 6px;
  width: 6px;
  border-radius: 999px;
  background: var(--studio-warm);
}
</style>
