<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'
import { SubscriptionApi } from '@/api/subscription'
import { apiErrorMessage } from '@/api/client'
import { loadRazorpayCheckout } from '@/lib/razorpay'

const auth = useAuthStore()
const sub = useSubscriptionStore()
const { t } = useI18n()
const payments = ref([])
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const subscribingPlanId = ref(null)

const statusLabels = computed(() => ({
  trialing: t('subscription.status.trialing'),
  trial_ending_soon: t('subscription.status.trialEndingSoon'),
  trial_expired: t('subscription.status.trialExpired'),
  subscription_required: t('subscription.status.subscriptionRequired'),
  active: t('subscription.status.active'),
  renewal_due: t('subscription.status.renewalDue'),
  past_due: t('subscription.status.pastDue'),
  grace_period: t('subscription.status.gracePeriod'),
  suspended: t('subscription.status.suspended'),
  cancelled: t('subscription.status.cancelled'),
}))

const statusColors = {
  trialing: 'info',
  trial_ending_soon: 'warning',
  trial_expired: 'error',
  subscription_required: 'error',
  active: 'success',
  renewal_due: 'warning',
  past_due: 'warning',
  grace_period: 'warning',
  suspended: 'error',
  cancelled: 'error',
}

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    await sub.refresh()
    payments.value = await SubscriptionApi.payments()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function isCurrentPlan(plan) {
  return sub.plan?.id === plan.id
}

async function subscribe(plan) {
  subscribingPlanId.value = plan.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await loadRazorpayCheckout()
    const checkout = await SubscriptionApi.createCheckout(plan.id)

    const razorpay = new window.Razorpay({
      key: checkout.key_id,
      order_id: checkout.order_id,
      amount: Math.round(Number(checkout.amount) * 100),
      currency: checkout.currency,
      name: auth.currentBusiness?.name || t('nav.subscription'),
      description: t('subscription.planSuffix', { plan: plan.name }),
      prefill: { name: auth.user?.full_name, email: auth.user?.email },
      theme: { color: '#1E88E5' },
      handler: async (response) => {
        try {
          await SubscriptionApi.verifyCheckout({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          successMessage.value = t('subscription.nowSubscribed', { plan: plan.name })
          await load()
        } catch (error) {
          errorMessage.value = apiErrorMessage(error, t('subscription.verificationFailed'))
        } finally {
          subscribingPlanId.value = null
        }
      },
      modal: {
        ondismiss: () => {
          subscribingPlanId.value = null
        },
      },
    })

    razorpay.open()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
    subscribingPlanId.value = null
  }
}
</script>

<template>
  <v-container max-width="900" class="py-8">
    <h1 class="text-h5 font-weight-bold mb-1">{{ $t('nav.subscription') }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      {{ $t('subscription.subtitle') }}
    </p>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">{{ successMessage }}</v-alert>

      <v-card class="pa-6 mb-6" border>
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div>
            <div class="text-caption text-medium-emphasis">{{ $t('subscription.currentStatus') }}</div>
            <div class="text-h6 font-weight-bold">
              {{ sub.plan?.name || $t('subscription.noPlanSelected') }}
            </div>
          </div>
          <v-chip :color="statusColors[sub.status] || 'default'" variant="tonal">
            {{ statusLabels[sub.status] || sub.status }}
          </v-chip>
        </div>

        <div v-if="sub.daysRemaining !== null" class="text-body-2 text-medium-emphasis mt-3">
          {{ $t('subscription.daysRemaining', { count: sub.daysRemaining }) }}
        </div>

        <v-alert
          v-if="!sub.entitled"
          type="error"
          variant="tonal"
          density="comfortable"
          class="mt-4"
        >
          {{ $t('subscription.cannotUsePlatform') }}
        </v-alert>
      </v-card>

      <div class="text-subtitle-1 font-weight-bold mb-3">{{ $t('subscription.plans') }}</div>
      <v-row class="mb-6">
        <v-col v-for="plan in sub.plans" :key="plan.id" cols="12" sm="4">
          <v-card
            class="pa-5 h-100"
            :class="{ 'border-primary': isCurrentPlan(plan) }"
            border
            variant="outlined"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <div class="font-weight-bold">{{ plan.name }}</div>
              <v-chip v-if="isCurrentPlan(plan)" size="small" color="primary" variant="tonal">{{ $t('subscription.current') }}</v-chip>
            </div>
            <div class="text-h5 font-weight-bold mb-1">
              {{ plan.currency }} {{ plan.price }}
              <span class="text-body-2 text-medium-emphasis font-weight-regular">
                / {{ plan.billing_period === 'monthly' ? $t('subscription.mo') : $t('subscription.yr') }}
              </span>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-3">{{ plan.description }}</p>
            <v-list density="compact" class="pa-0">
              <v-list-item
                v-for="(enabled, key) in plan.features"
                :key="key"
                v-show="enabled"
                prepend-icon="mdi-check"
                class="px-0"
              >
                <v-list-item-title class="text-body-2">
                  {{ key.replaceAll('_', ' ') }}{{ typeof enabled === 'number' ? `: ${enabled}` : '' }}
                </v-list-item-title>
              </v-list-item>
            </v-list>

            <v-btn
              :id="`subscribe-plan-${plan.id}`"
              class="mt-3"
              block
              :color="isCurrentPlan(plan) ? 'default' : 'primary'"
              :variant="isCurrentPlan(plan) ? 'tonal' : 'flat'"
              :loading="subscribingPlanId === plan.id"
              :disabled="subscribingPlanId !== null && subscribingPlanId !== plan.id"
              @click="subscribe(plan)"
            >
              {{ isCurrentPlan(plan) ? $t('subscription.renew') : $t('subscription.subscribe') }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="pa-4 mb-6" border>
        <div class="d-flex align-center ga-3">
          <v-icon icon="mdi-shield-check-outline" color="primary" />
          <div class="text-body-2">
            {{ $t('subscription.razorpayHint') }}
          </div>
        </div>
      </v-card>

      <div class="text-subtitle-1 font-weight-bold mb-3">{{ $t('subscription.paymentHistory') }}</div>
      <v-card border>
        <div v-if="!payments.length" class="pa-8 text-center text-body-2 text-medium-emphasis">
          {{ $t('subscription.noPaymentsYet') }}
        </div>
        <v-table v-else density="comfortable">
          <thead>
            <tr>
              <th>{{ $t('stockMovements.date') }}</th>
              <th>{{ $t('subscription.plan') }}</th>
              <th>{{ $t('subscription.period') }}</th>
              <th>{{ $t('invoices.amount') }}</th>
              <th>{{ $t('products.table.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.id">
              <td>{{ new Date(payment.inserted_at).toLocaleDateString() }}</td>
              <td>{{ payment.plan_name }}</td>
              <td>
                <template v-if="payment.period_start && payment.period_end">
                  {{ new Date(payment.period_start).toLocaleDateString() }} -
                  {{ new Date(payment.period_end).toLocaleDateString() }}
                </template>
                <template v-else>&mdash;</template>
              </td>
              <td>{{ payment.currency }} {{ payment.amount }}</td>
              <td>
                <v-chip size="small" :color="payment.status === 'paid' ? 'success' : 'default'" variant="tonal">
                  {{ $t(`subscription.paymentStatus.${payment.status}`) }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </template>
  </v-container>
</template>
