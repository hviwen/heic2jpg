import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { i18n, DEFAULT_LOCALE } from '../i18n'
import type { AppLocale } from '../i18n/messages'

const LANGUAGE_STORAGE_KEY = 'heic2jpg-language'

export const usePreferencesStore = defineStore('preferences', () => {
  const language = ref<AppLocale>(DEFAULT_LOCALE)

  const initPreferences = () => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLocale | null
    if (savedLanguage && (savedLanguage === 'zh-CN' || savedLanguage === 'en-US')) {
      language.value = savedLanguage
    }

    i18n.global.locale.value = language.value
    document.documentElement.lang = language.value
  }

  const setLanguage = (locale: AppLocale) => {
    language.value = locale
  }

  watch(language, (value) => {
    i18n.global.locale.value = value
    document.documentElement.lang = value
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value)
  })

  return {
    language,
    initPreferences,
    setLanguage
  }
})
