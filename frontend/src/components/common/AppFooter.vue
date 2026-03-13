<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NInput,
  NModal,
  NRadioButton,
  NRadioGroup,
  NSpace,
  NThing,
  useMessage
} from 'naive-ui'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const message = useMessage()

const currentYear = new Date().getFullYear()
const showFeedback = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref<'bug' | 'feature' | 'question'>('feature')
const isSubmitting = ref(false)

const footerLinks = computed(() => [
  { name: t('footer.links.docs'), path: '/about' },
  { name: t('footer.links.history'), path: '/history' },
  { name: t('footer.links.settings'), path: '/settings' },
  { name: t('footer.links.sponsor'), href: 'https://github.com/sponsors', external: true }
])
const internalLinks = computed(() => footerLinks.value.filter((item) => !item.external))
const externalLinks = computed(() => footerLinks.value.filter((item) => item.external))

const navigateTo = (path: string) => {
  void router.push(path)
}

const closeFeedback = () => {
  showFeedback.value = false
  feedbackMessage.value = ''
  feedbackType.value = 'feature'
  isSubmitting.value = false
}

const submitFeedback = async () => {
  if (!feedbackMessage.value.trim() || isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 600))
    message.success(t('footer.feedbackSent'))
    closeFeedback()
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <footer class="px-3 pb-4 md:px-4">
    <NCard embedded :bordered="false" class="studio-panel footer-shell">
      <div class="grid gap-8 px-5 py-6 md:px-8 md:py-8 lg:grid-cols-[1.5fr_1fr]">
        <div class="space-y-4">
          <div class="studio-label">{{ t('app.name') }}</div>
          <h2 class="studio-display max-w-3xl text-3xl font-semibold leading-tight md:text-4xl">
            {{ t('app.tagline') }}
          </h2>
          <p class="max-w-2xl text-sm leading-7 text-[var(--studio-muted)] md:text-base">
            {{ t('home.supportDescription') }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <NThing>
            <template #header>{{ t('nav.about') }}</template>
            <template #description>{{ t('common.learnMore') }}</template>
            <div class="mt-3 space-y-2">
              <a
                v-for="link in externalLinks"
                :key="link.name"
                :href="link.href"
                target="_blank"
                rel="noreferrer"
                class="footer-link"
              >
                {{ link.name }}
              </a>
              <button
                v-for="link in internalLinks"
                :key="link.name"
                class="footer-link"
                @click="link.path && navigateTo(link.path)"
              >
                {{ link.name }}
              </button>
            </div>
          </NThing>

          <NThing>
            <template #header>{{ t('footer.feedback') }}</template>
            <template #description>{{ t('footer.feedbackTitle') }}</template>
            <NButton class="mt-3" strong secondary @click="showFeedback = true">
              {{ t('footer.feedback') }}
            </NButton>
          </NThing>
        </div>
      </div>

      <div class="footer-meta">
        <span>© {{ currentYear }} HEIC2JPG</span>
        <span>{{ t('home.privacy') }}</span>
      </div>
    </NCard>

    <NModal
      v-model:show="showFeedback"
      preset="card"
      class="max-w-[560px]"
      :title="t('footer.feedbackTitle')"
      :bordered="false"
      :segmented="{ content: true }"
    >
      <NSpace vertical :size="18">
        <NRadioGroup v-model:value="feedbackType" name="feedbackType">
          <NSpace>
            <NRadioButton value="bug">{{ t('footer.feedbackType.bug') }}</NRadioButton>
            <NRadioButton value="feature">{{ t('footer.feedbackType.feature') }}</NRadioButton>
            <NRadioButton value="question">{{ t('footer.feedbackType.question') }}</NRadioButton>
          </NSpace>
        </NRadioGroup>

        <NInput
          v-model:value="feedbackMessage"
          type="textarea"
          :autosize="{ minRows: 5, maxRows: 9 }"
          :placeholder="t('footer.feedbackPlaceholder')"
        />

        <div class="flex justify-end gap-3">
          <NButton @click="closeFeedback">{{ t('common.cancel') }}</NButton>
          <NButton type="primary" :loading="isSubmitting" @click="submitFeedback">
            {{ t('common.save') }}
          </NButton>
        </div>
      </NSpace>
    </NModal>
  </footer>
</template>

<style scoped>
.footer-shell {
  border-radius: 32px;
}

.footer-link {
  display: block;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  color: var(--studio-muted);
}

.footer-link:hover {
  color: var(--studio-ink);
}

.footer-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--studio-line);
  padding: 16px 20px 18px;
  color: var(--studio-muted);
  font-size: 12px;
}
</style>
