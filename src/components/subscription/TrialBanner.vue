<script setup>
import { computed } from 'vue'
import { useSubscriptionStore } from '@/stores/subscription'

const sub = useSubscriptionStore()

// Progressive trial-expiry messaging (Phase 2 §9) - quiet until 14 days
// out, then increasingly urgent, and a clear call to action once the
// business is actually blocked.
const banner = computed(() => {
  const days = sub.daysRemaining

  switch (sub.status) {
    case 'trialing':
      if (days === null || days > 14) return null
      return { type: 'info', message: `Your free trial has ${days} day${days === 1 ? '' : 's'} remaining.` }

    case 'trial_ending_soon':
      return {
        type: 'warning',
        message: `Your trial ends in ${days} day${days === 1 ? '' : 's'}. Choose a plan to keep using the platform without interruption.`,
      }

    case 'trial_expired':
      return { type: 'error', message: 'Your free trial has ended. Choose a plan to continue.' }

    case 'subscription_required':
      return { type: 'error', message: 'This business needs an active subscription to continue.' }

    case 'renewal_due':
      return days !== null && days <= 7
        ? { type: 'warning', message: `Your plan renews in ${days} day${days === 1 ? '' : 's'}.` }
        : null

    case 'past_due':
      return { type: 'warning', message: 'Your last subscription payment failed. Please update your payment.' }

    case 'grace_period':
      return {
        type: 'warning',
        message: `Payment issue - your account will be suspended in ${days ?? 'a few'} day${days === 1 ? '' : 's'} unless this is resolved.`,
      }

    case 'suspended':
      return { type: 'error', message: 'This business has been suspended due to a subscription issue.' }

    case 'cancelled':
      return { type: 'error', message: 'This business’s subscription was cancelled.' }

    default:
      return null
  }
})
</script>

<template>
  <v-alert
    v-if="banner"
    id="trial-banner"
    :type="banner.type"
    variant="tonal"
    density="comfortable"
    class="rounded-0"
    closable
  >
    <div class="d-flex align-center justify-space-between flex-wrap ga-2">
      <span>{{ banner.message }}</span>
      <v-btn
        id="trial-banner-action"
        size="small"
        :color="banner.type === 'info' ? 'primary' : banner.type"
        variant="flat"
        :to="{ name: 'subscription' }"
      >
        View Plans
      </v-btn>
    </div>
  </v-alert>
</template>
