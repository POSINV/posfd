import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Central design tokens for the platform. Pages must not invent their own
// colors/spacing - everything visual comes from this theme + the
// component defaults below (see AGENTS.md §19 Design System).
const lightTheme = {
  dark: false,
  colors: {
    background: '#F6F7FB',
    surface: '#FFFFFF',
    'surface-variant': '#F0F1F7',
    primary: '#4F46E5',
    'primary-darken-1': '#4338CA',
    'primary-lighten-1': '#EEF0FE',
    secondary: '#0EA5A4',
    accent: '#F59E0B',
    error: '#DC2626',
    warning: '#D97706',
    success: '#16A34A',
    info: '#2563EB',
    'on-surface': '#111827',
  },
  variables: {
    'border-color': '#111827',
    'border-opacity': 0.08,
    'medium-emphasis-opacity': 0.64,
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'lightTheme',
    themes: { lightTheme },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  defaults: {
    global: {
      ripple: true,
    },
    VBtn: {
      rounded: 'lg',
      elevation: 0,
      class: 'text-none font-weight-medium',
    },
    VCard: {
      rounded: 'lg',
      elevation: 0,
      border: true,
    },
    VChip: {
      rounded: 'lg',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      color: 'primary',
    },
    VNavigationDrawer: {
      elevation: 0,
    },
    VAppBar: {
      elevation: 0,
    },
    VTooltip: {
      location: 'top',
    },
  },
})
