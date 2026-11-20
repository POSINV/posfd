import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { THEME_STORAGE_KEY } from '@/plugins/vuetify'

/** Light/dark toggle, remembered per browser. */
export function useUiTheme() {
  const theme = useTheme()
  const isDark = computed(() => theme.global.current.value.dark)

  function setTheme(name) {
    theme.global.name.value = name
    try {
      localStorage.setItem(THEME_STORAGE_KEY, name)
    } catch {
      // Storage disabled - the choice just won't persist.
    }
  }

  function toggle() {
    setTheme(isDark.value ? 'lightTheme' : 'darkTheme')
  }

  return { isDark, toggle, setTheme }
}
