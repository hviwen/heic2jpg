import { createI18n } from 'vue-i18n'
import { messages, type AppLocale } from './messages'

export const DEFAULT_LOCALE: AppLocale = 'zh-CN'

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'en-US',
  messages
})
