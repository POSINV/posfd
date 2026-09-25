import { defineStore } from 'pinia'
import { SubscriptionApi } from '@/api/subscription'

export const useSubscriptionStore = defineStore('subscription', {
  state: () => ({
    status: null,
    entitled: true,
    trialEndsAt: null,
    daysRemaining: null,
    plan: null,
    plans: [],
    loaded: false,
  }),

  actions: {
    async refresh() {
      try {
        const data = await SubscriptionApi.status()
        this.status = data.status
        this.entitled = data.entitled
        this.trialEndsAt = data.trial_ends_at
        this.daysRemaining = data.days_remaining
        this.plan = data.plan
        this.plans = data.plans
        this.loaded = true
      } catch {
        // A logged-out/no-business state shouldn't surface as a banner error.
      }
    },

    reset() {
      this.status = null
      this.entitled = true
      this.trialEndsAt = null
      this.daysRemaining = null
      this.plan = null
      this.plans = []
      this.loaded = false
    },
  },
})
