import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Central design tokens for the platform. Pages must not invent their own
// colors/spacing - everything visual comes from this theme + the
// component defaults below (see AGENTS.md §19 Design System).
// Palette is modelled on Linear / Pinterest: near-neutral greys, one
// confident accent, hairline borders instead of shadows, and a true dark
// mode. Token names are unchanged so every existing page keeps working.
const lightTheme = {
  dark: false,
  colors: {
    background: '#F7F7F8',
    surface: '#FFFFFF',
    'surface-variant': '#F1F1F3',
    'surface-bright': '#FFFFFF',
    primary: '#5E6AD2',
    'primary-darken-1': '#4C56B8',
    'primary-lighten-1': '#EEEFFC',
    secondary: '#0F9D8F',
    accent: '#E60023',
    error: '#DC2626',
    warning: '#D97706',
    success: '#16A34A',
    info: '#2563EB',
    'on-surface': '#18181B',
    'on-background': '#18181B',
    sidebar: '#FBFBFC',
  },
  variables: {
    'border-color': '#18181B',
    'border-opacity': 0.08,
    'medium-emphasis-opacity': 0.62,
    'hover-opacity': 0.04,
  },
}

const darkTheme = {
  dark: true,
  colors: {
    background: '#0E0F12',
    surface: '#16171B',
    'surface-variant': '#1E1F24',
    'surface-bright': '#202127',
    primary: '#7C86F0',
    'primary-darken-1': '#5E6AD2',
    'primary-lighten-1': '#23253A',
    secondary: '#2DD4BF',
    accent: '#FF4D6A',
    error: '#F87171',
    warning: '#FBBF24',
    success: '#4ADE80',
    info: '#60A5FA',
    'on-surface': '#EDEDEF',
    'on-background': '#EDEDEF',
    sidebar: '#121317',
  },
  variables: {
    'border-color': '#FFFFFF',
    'border-opacity': 0.08,
    'medium-emphasis-opacity': 0.6,
    'hover-opacity': 0.05,
  },
}

export const THEME_STORAGE_KEY = 'posfd:theme'

const storedTheme = (() => {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'darkTheme' || v === 'lightTheme' ? v : null
  } catch {
    return null
  }
})()

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: storedTheme || 'lightTheme',
    themes: { lightTheme, darkTheme },
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
      rounded: 'pill',
    },
    VMenu: {
      transition: 'scale-transition',
    },
    VDialog: {
      scrim: 'rgba(10, 10, 14, 0.45)',
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
