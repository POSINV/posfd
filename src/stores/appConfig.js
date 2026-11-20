import { defineStore } from 'pinia'
import { AppConfigApi } from '@/api/appConfig'

// Which environment the backend runs as and which external integrations
// (email, WhatsApp, Razorpay) are switched on there. They only run in
// staging and production; in local development the backend turns them
// off, and the UI uses this to hide/disable those features rather than
// letting them fail. The backend is the source of truth and enforces it
// either way - this store is only for the UI.
export const useAppConfigStore = defineStore('appConfig', {
  state: () => ({
    appEnv: null,
    integrations: {},
    loaded: false,
  }),

  getters: {
    isLocal: (state) => state.appEnv === 'local',
    // Until the config has loaded (or if it can't be fetched), assume the
    // integration is on so staging/production never lose a feature over a
    // transient error - the backend still refuses it if it's really off.
    integrationEnabled: (state) => (name) =>
      !state.loaded || state.integrations[name]?.enabled !== false,
    razorpayEnabled() {
      return this.integrationEnabled('razorpay')
    },
    whatsappEnabled() {
      return this.integrationEnabled('whatsapp')
    },
    emailEnabled() {
      return this.integrationEnabled('email')
    },
  },

  actions: {
    async load() {
      if (this.loaded) return
      try {
        const data = await AppConfigApi.get()
        this.appEnv = data.app_env
        this.integrations = data.integrations || {}
        this.loaded = true
      } catch {
        // Leave defaults in place; see integrationEnabled above.
      }
    },
  },
})
