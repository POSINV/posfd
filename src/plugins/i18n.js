import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import ta from '@/locales/ta.json'
import te from '@/locales/te.json'
import ml from '@/locales/ml.json'
import mr from '@/locales/mr.json'
import gu from '@/locales/gu.json'
import bn from '@/locales/bn.json'
import kn from '@/locales/kn.json'

// Adding a language means adding a locale file + registering it here -
// no component changes needed (see AGENTS.md §21 Internationalization).
// Picked to match the cities the product targets first: Chennai (ta),
// Hyderabad/Vijayawada (te), Cochin (ml), Mumbai/Maharashtra (mr),
// Gujarat (gu), Kolkata (bn), plus Kannada (kn) already offered as an
// onboarding option.
export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]

const STORAGE_KEY = 'posfd:locale'

const storedLocale = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
})()

const i18n = createI18n({
  legacy: false,
  locale: storedLocale || 'en',
  fallbackLocale: 'en',
  messages: { en, hi, ta, te, ml, mr, gu, bn, kn },
})

/** Switches the running app's language and remembers it for next time. */
export function setLocale(code) {
  if (!SUPPORTED_LOCALES.some((l) => l.code === code)) return
  i18n.global.locale.value = code
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Private browsing / storage disabled - the choice just won't persist.
  }
}

export default i18n
