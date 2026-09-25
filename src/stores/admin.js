import { defineStore } from 'pinia'
import { AdminApi } from '@/api/admin'
import { setAdminAuthToken } from '@/api/adminClient'

const TOKEN_KEY = 'posfd:admin_token'

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
    // Private browsing / storage disabled - auth still works for this tab.
  }
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    token: readStorage(TOKEN_KEY),
    admin: null,
    ready: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    _applyToken(token) {
      this.token = token
      writeStorage(TOKEN_KEY, token)
      setAdminAuthToken(token)
    },

    async login(email, password) {
      const data = await AdminApi.login(email, password)
      this._applyToken(data.token)
      this.admin = data.admin
      return data.admin
    },

    async logout() {
      try {
        if (this.token) await AdminApi.logout()
      } finally {
        this._applyToken(null)
        this.admin = null
      }
    },

    async initialize() {
      setAdminAuthToken(this.token)

      if (this.token) {
        try {
          this.admin = await AdminApi.me()
        } catch {
          this._applyToken(null)
        }
      }

      this.ready = true
    },
  },
})
