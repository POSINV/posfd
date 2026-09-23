import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'

// Adding a language means adding a locale file + registering it here -
// no component changes needed (see AGENTS.md §21 Internationalization).
export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
]

const storedLocale = (() => {
  try {
    return localStorage.getItem('posfd:locale')
  } catch {
    return null
  }
})()

export default createI18n({
  legacy: false,
  locale: storedLocale || 'en',
  fallbackLocale: 'en',
  messages: { en, hi },
})
