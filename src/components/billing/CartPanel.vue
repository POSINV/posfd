<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  customers: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  loyaltyProgram: { type: Object, default: null },
})
const emit = defineEmits(['complete-sale'])

const cart = defineModel('cart', { default: () => [] })
const customerId = defineModel('customerId', { default: null })
const paymentMethod = defineModel('paymentMethod', { default: 'cash' })
const paymentAmount = defineModel('paymentAmount', { default: '' })
const redeemPoints = defineModel('redeemPoints', { default: '' })
const offerCode = defineModel('offerCode', { default: '' })

const customerSearch = ref('')

const PAYMENT_METHODS = computed(() => [
  { title: t('billing.cart.paymentMethods.cash'), value: 'cash' },
  { title: t('billing.cart.paymentMethods.card'), value: 'card' },
  { title: t('billing.cart.paymentMethods.upi'), value: 'upi' },
  { title: t('billing.cart.paymentMethods.credit'), value: 'credit' },
  { title: t('billing.cart.paymentMethods.other'), value: 'other' },
])

function removeLine(key) {
  cart.value = cart.value.filter((l) => l.key !== key)
}

function lineSubtotal(line) {
  return line.unit_price * line.quantity
}

function lineTaxable(line) {
  return Math.max(lineSubtotal(line) - (Number(line.discount_amount) || 0), 0)
}

function lineTotal(line) {
  const taxable = lineTaxable(line)
  return taxable + (taxable * line.tax_rate) / 100
}

const subtotal = computed(() => cart.value.reduce((s, l) => s + lineSubtotal(l), 0))
const discount = computed(() => cart.value.reduce((s, l) => s + (Number(l.discount_amount) || 0), 0))
const tax = computed(() => cart.value.reduce((s, l) => s + (lineTaxable(l) * l.tax_rate) / 100, 0))
const preLoyaltyTotal = computed(() => cart.value.reduce((s, l) => s + lineTotal(l), 0))

const selectedCustomer = computed(() => props.customers.find((c) => c.id === customerId.value) || null)

const loyaltyActive = computed(() => props.loyaltyProgram?.active)

// Client-side estimate only, purely for cashier feedback while typing - the
// backend independently validates and computes the real discount/earn
// figures when the invoice is actually created (never trust this number).
const estimatedRedemptionValue = computed(() => {
  if (!loyaltyActive.value || !Number(redeemPoints.value)) return 0
  return Number(redeemPoints.value) * Number(props.loyaltyProgram.redeem_value_per_point || 0)
})

const total = computed(() => Math.max(preLoyaltyTotal.value - estimatedRedemptionValue.value, 0))

const estimatedPointsEarned = computed(() => {
  if (!loyaltyActive.value || !selectedCustomer.value) return 0
  const earnAmount = Number(props.loyaltyProgram.earn_amount_per_point || 0)
  if (!earnAmount) return 0
  return Math.floor(Math.max(total.value, 0) / earnAmount)
})

defineExpose({ total })

watch(total, (t) => {
  if (paymentMethod.value !== 'credit') paymentAmount.value = t.toFixed(2)
})

watch(customerId, () => {
  redeemPoints.value = ''
})

watch(paymentMethod, (method) => {
  paymentAmount.value = method === 'credit' ? '0' : total.value.toFixed(2)
})

const filteredCustomers = computed(() => {
  if (!customerSearch.value) return props.customers
  const term = customerSearch.value.toLowerCase()
  return props.customers.filter(
    (c) => c.name.toLowerCase().includes(term) || (c.phone || '').includes(term),
  )
})
</script>

<template>
  <div>
    <div v-if="!cart.length" class="text-body-2 text-medium-emphasis text-center py-8">
      {{ $t('billing.cart.empty') }}
    </div>

    <div v-else>
      <div v-for="line in cart" :key="line.key" class="d-flex align-center mb-3">
        <div class="flex-grow-1">
          <div class="text-body-2 font-weight-medium">{{ line.name }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ line.unit_price.toFixed(2) }} × {{ line.quantity }} = {{ lineTotal(line).toFixed(2) }}
          </div>
        </div>
        <v-btn icon="mdi-minus" size="x-small" variant="text" @click="line.quantity > 1 && line.quantity--" />
        <span class="mx-1">{{ line.quantity }}</span>
        <v-btn icon="mdi-plus" size="x-small" variant="text" @click="line.quantity++" />
        <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removeLine(line.key)" />
      </div>

      <v-divider class="my-3" />

      <v-autocomplete
        v-model="customerId"
        v-model:search="customerSearch"
        :items="filteredCustomers.map((c) => ({ title: `${c.name}${c.phone ? ' · ' + c.phone : ''}`, value: c.id }))"
        :label="$t('billing.cart.customerLabel')"
        clearable
        density="comfortable"
        class="mb-2"
      />

      <v-card
        v-if="loyaltyActive && selectedCustomer"
        variant="tonal"
        color="primary"
        class="pa-3 mb-3"
      >
        <div class="d-flex justify-space-between text-body-2 mb-2">
          <span>{{ $t('billing.cart.loyaltyPointsFor', { name: selectedCustomer.name }) }}</span>
          <span class="font-weight-bold">{{ $t('billing.cart.pointsAvailable', { count: selectedCustomer.loyalty_points_balance }) }}</span>
        </div>
        <v-text-field
          id="redeem-points-input"
          v-model="redeemPoints"
          :label="$t('billing.cart.redeemPoints')"
          type="number"
          min="0"
          :max="selectedCustomer.loyalty_points_balance"
          density="compact"
          hide-details
          class="mb-1"
        />
        <div v-if="Number(redeemPoints) > 0" class="text-caption text-medium-emphasis mt-1">
          {{ $t('billing.cart.redemptionEstimate', { amount: estimatedRedemptionValue.toFixed(2) }) }}
        </div>
        <div v-if="estimatedPointsEarned > 0" class="text-caption text-medium-emphasis mt-1">
          {{ $t('billing.cart.earnEstimate', { count: estimatedPointsEarned }) }}
        </div>
      </v-card>

      <v-text-field
        id="offer-code-input"
        v-model="offerCode"
        :label="$t('billing.cart.promoCode')"
        density="comfortable"
        clearable
        class="mb-2"
      />

      <v-select v-model="paymentMethod" :items="PAYMENT_METHODS" :label="$t('billing.cart.paymentMethod')" density="comfortable" class="mb-2" />
      <v-text-field v-model="paymentAmount" :label="$t('billing.cart.amountReceived')" density="comfortable" class="mb-2" />

      <div class="d-flex justify-space-between text-body-2">
        <span>{{ $t('billing.cart.subtotal') }}</span><span>{{ subtotal.toFixed(2) }}</span>
      </div>
      <div v-if="discount > 0" class="d-flex justify-space-between text-body-2 text-error">
        <span>{{ $t('billing.cart.discount') }}</span><span>-{{ discount.toFixed(2) }}</span>
      </div>
      <div class="d-flex justify-space-between text-body-2">
        <span>{{ $t('billing.cart.tax') }}</span><span>{{ tax.toFixed(2) }}</span>
      </div>
      <div v-if="estimatedRedemptionValue > 0" class="d-flex justify-space-between text-body-2 text-primary">
        <span>{{ $t('billing.cart.loyaltyRedemption') }}</span><span>-{{ estimatedRedemptionValue.toFixed(2) }}</span>
      </div>
      <div class="d-flex justify-space-between text-h6 font-weight-bold mt-1">
        <span>{{ $t('billing.cart.total') }}</span><span>{{ total.toFixed(2) }}</span>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mt-3">
        {{ errorMessage }}
      </v-alert>

      <v-btn
        id="complete-sale-btn"
        color="primary"
        size="large"
        block
        class="mt-4"
        :loading="submitting"
        @click="emit('complete-sale')"
      >
        {{ $t('billing.cart.completeSale') }}
      </v-btn>
    </div>
  </div>
</template>
