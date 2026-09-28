<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSubscriptionStore } from '@/stores/subscription'

const sub = useSubscriptionStore()
const { t } = useI18n()

// Progressive trial-expiry messaging (Phase 2 §9) - quiet until 14 days
// out, then increasingly urgent, and a clear call to action once the
// business is actually blocked.
const banner = computed(() => {
  const days = sub.daysRemaining

  switch (sub.status) {
    case 'trialing':
      if (days === null || days > 14) return null
      return { type: 'info', message: t('subscription.banner.trialing', { count: days }) }

    case 'trial_ending_soon':
      return { type: 'warning', message: t('subscription.banner.trialEndingSoon', { count: days }) }

    case 'trial_expired':
      return { type: 'error', message: t('subscription.banner.trialExpired') }

    case 'subscription_required':
      return { type: 'error', message: t('subscription.banner.subscriptionRequired') }

    case 'renewal_due':
      return days !== null && days <= 7
        ? { type: 'warning', message: t('subscription.banner.renewalDue', { count: days }) }
        : null

    case 'past_due':
      return { type: 'warning', message: t('subscription.banner.pastDue') }

    case 'grace_period':
      return {
        type: 'warning',
        message:
          days === null
            ? t('subscription.banner.gracePeriodUnknownDays')
            : t('subscription.banner.gracePeriod', { count: days }),
      }

    case 'suspended':
      return { type: 'error', message: t('subscription.banner.suspended') }

    case 'cancelled':
      return { type: 'error', message: t('subscription.banner.cancelled') }

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
        {{ $t('subscription.viewPlans') }}
      </v-btn>
    </div>
  </v-alert>
</template>
