import { defineStore } from 'pinia'
import client, { setAuthToken, setCurrentBusinessId } from '@/api/client'
import { useSubscriptionStore } from '@/stores/subscription'

const TOKEN_KEY = 'posfd:token'
const BUSINESS_ID_KEY = 'posfd:business_id'

function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    if (value) {
      localStorage.setItem(key, value)
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // Storage can be unavailable (private browsing); auth still works
    // for the current tab via in-memory state.
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: readStorage(TOKEN_KEY),
    user: null,
    businesses: [],
    currentBusinessId: readStorage(BUSINESS_ID_KEY),
    ready: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentBusiness: (state) =>
      state.businesses.find((b) => b.id === state.currentBusinessId) || null,
    hasCompletedOnboarding: (state) =>
      state.businesses.some((b) => b.onboarding_completed),
  },

  actions: {
    _applyToken(token) {
      this.token = token
      writeStorage(TOKEN_KEY, token)
      setAuthToken(token)
    },

    _applyCurrentBusiness(businessId) {
      this.currentBusinessId = businessId
      writeStorage(BUSINESS_ID_KEY, businessId)
      setCurrentBusinessId(businessId)
    },

    async register({ email, password, fullName }) {
      const { data } = await client.post('/auth/register', {
        user: { email, password, full_name: fullName },
      })
      this._applyToken(data.token)
      this.user = data.user
      this.businesses = []
      return data
    },

    async login({ email, password }) {
      const { data } = await client.post('/auth/login', { email, password })
      this._applyToken(data.token)
      await this.fetchCurrentUser()
      return data
    },

    async logout() {
      try {
        if (this.token) await client.delete('/auth/logout')
      } finally {
        this._applyToken(null)
        this._applyCurrentBusiness(null)
        this.user = null
        this.businesses = []
        useSubscriptionStore().reset()
      }
    },

    async fetchCurrentUser() {
      if (!this.token) return
      const { data } = await client.get('/me')
      this.user = data.user
      this.businesses = data.businesses

      if (!this.currentBusinessId && data.businesses.length > 0) {
        this._applyCurrentBusiness(data.businesses[0].id)
      }
    },

    async createBusiness(attrs) {
      const { data } = await client.post('/businesses', { business: attrs })
      this.businesses.push(data.data)
      this._applyCurrentBusiness(data.data.id)
      return data.data
    },

    async completeOnboarding(businessId) {
      const { data } = await client.post(`/businesses/${businessId}/complete_onboarding`)
      const idx = this.businesses.findIndex((b) => b.id === businessId)
      if (idx !== -1) this.businesses[idx] = data.data
      return data.data
    },

    selectBusiness(businessId) {
      this._applyCurrentBusiness(businessId)
    },

    /** Restores auth state on app boot from the persisted token. */
    async initialize() {
      setAuthToken(this.token)
      setCurrentBusinessId(this.currentBusinessId)

      if (this.token) {
        try {
          await this.fetchCurrentUser()
        } catch {
          this._applyToken(null)
          this._applyCurrentBusiness(null)
        }
      }

      this.ready = true
    },
  },
})
