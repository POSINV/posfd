<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { CustomersApi } from '@/api/customers'
import { BillingApi } from '@/api/billing'
import { LoyaltyApi } from '@/api/loyalty'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({ id: { type: String, required: true } })
const { t } = useI18n()

const customer = ref(null)
const summary = ref(null)
const invoices = ref([])
const loyalty = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const entryTypeLabels = computed(() => ({
  earn: t('loyalty.entryTypes.earn'),
  redeem: t('loyalty.entryTypes.redeem'),
  bonus: t('loyalty.entryTypes.bonus'),
  expire: t('loyalty.entryTypes.expire'),
  adjustment: t('loyalty.entryTypes.adjustment'),
}))

const segmentColors = { vip: 'purple', high_value: 'primary', regular: 'success', new: 'info', inactive: 'default' }
const segmentLabels = computed(() => ({
  vip: t('common.segments.vip'),
  high_value: t('common.segments.highValue'),
  regular: t('common.segments.regular'),
  new: t('common.segments.new'),
  inactive: t('common.segments.inactive'),
}))

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [customerData, summaryData, invoicesData, loyaltyData] = await Promise.all([
      CustomersApi.get(props.id),
      CustomersApi.summary(props.id),
      BillingApi.listInvoices({ customer_id: props.id }),
      LoyaltyApi.getLedger(props.id, { page_size: 10 }),
    ])
    customer.value = customerData
    summary.value = summaryData
    invoices.value = invoicesData.data
    loyalty.value = loyaltyData
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container max-width="900" class="py-8">
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'customers' }" class="mr-2" />
      <h1 class="text-h5 font-weight-bold">{{ $t('customers.customer') }}</h1>
    </div>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-alert v-else-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</v-alert>

    <template v-else-if="customer && summary">
      <v-card class="pa-6 mb-6" border>
        <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
          <div class="text-h6 font-weight-bold">{{ customer.name }}</div>
          <v-chip :color="segmentColors[summary.segment]" variant="tonal">
            {{ segmentLabels[summary.segment] || summary.segment }}
          </v-chip>
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ [customer.phone, customer.email, customer.address].filter(Boolean).join(' · ') || $t('customers.noContactInfo') }}
        </div>
        <div v-if="customer.notes" class="text-body-2 text-medium-emphasis mt-2">{{ customer.notes }}</div>
      </v-card>

      <v-row class="mb-6">
        <v-col cols="6" sm="3">
          <v-card class="pa-4" border>
            <div class="text-caption text-medium-emphasis">{{ $t('customers.totalSpent') }}</div>
            <div class="text-h6 font-weight-bold">{{ summary.total_spent }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card class="pa-4" border>
            <div class="text-caption text-medium-emphasis">{{ $t('customers.visits') }}</div>
            <div class="text-h6 font-weight-bold">{{ summary.visit_count }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card class="pa-4" border>
            <div class="text-caption text-medium-emphasis">{{ $t('customers.averageBill') }}</div>
            <div class="text-h6 font-weight-bold">{{ summary.average_bill }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card class="pa-4" border :class="{ 'bg-warning-lighten-5': Number(summary.outstanding_balance) > 0 }">
            <div class="text-caption text-medium-emphasis">{{ $t('customers.outstanding') }}</div>
            <div class="text-h6 font-weight-bold" :class="{ 'text-warning': Number(summary.outstanding_balance) > 0 }">
              {{ summary.outstanding_balance }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mb-6">
        <v-col cols="12" sm="6">
          <v-card class="pa-4 h-100" border>
            <div class="text-subtitle-2 font-weight-bold mb-3">{{ $t('customers.frequentlyPurchased') }}</div>
            <div v-if="!summary.top_products.length" class="text-body-2 text-medium-emphasis">
              {{ $t('customers.noPurchasesYet') }}
            </div>
            <v-list v-else density="compact" class="pa-0">
              <v-list-item v-for="p in summary.top_products" :key="p.name" class="px-0">
                <v-list-item-title class="text-body-2">{{ p.name }}</v-list-item-title>
                <template #append>
                  <span class="text-body-2 text-medium-emphasis">{{ p.quantity }}x &middot; {{ p.revenue }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card class="pa-4 h-100" border>
            <div class="text-subtitle-2 font-weight-bold mb-3">{{ $t('customers.communicationPreferences') }}</div>
            <div class="d-flex align-center ga-2 mb-2">
              <v-icon :icon="customer.accepts_transactional_messages ? 'mdi-check-circle' : 'mdi-close-circle-outline'" :color="customer.accepts_transactional_messages ? 'success' : 'medium-emphasis'" size="18" />
              <span class="text-body-2">{{ $t('customers.allowTransactional') }}</span>
            </div>
            <div class="d-flex align-center ga-2">
              <v-icon :icon="customer.accepts_promotional_messages ? 'mdi-check-circle' : 'mdi-close-circle-outline'" :color="customer.accepts_promotional_messages ? 'success' : 'medium-emphasis'" size="18" />
              <span class="text-body-2">{{ $t('customers.allowPromotional') }}</span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <template v-if="loyalty">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-subtitle-1 font-weight-bold">{{ $t('customers.loyaltyPoints') }}</div>
          <v-chip color="primary" variant="tonal">{{ $t('customers.pointsCount', { count: loyalty.balance }) }}</v-chip>
        </div>
        <v-card border class="mb-6">
          <div v-if="!loyalty.data.length" class="pa-8 text-center text-body-2 text-medium-emphasis">
            {{ $t('customers.noLoyaltyActivity') }}
          </div>
          <v-list v-else lines="two">
            <v-list-item v-for="entry in loyalty.data" :key="entry.id">
              <v-list-item-title>
                {{ entryTypeLabels[entry.entry_type] || entry.entry_type }}
                <span v-if="entry.invoice_number"> &middot; {{ entry.invoice_number }}</span>
              </v-list-item-title>
              <v-list-item-subtitle>{{ new Date(entry.inserted_at).toLocaleString() }}</v-list-item-subtitle>
              <template #append>
                <span class="font-weight-medium mr-3" :class="entry.points > 0 ? 'text-success' : 'text-error'">
                  {{ entry.points > 0 ? '+' : '' }}{{ entry.points }}
                </span>
                <span class="text-body-2 text-medium-emphasis">{{ $t('customers.balanceAbbrev', { count: entry.balance_after }) }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </template>

      <div class="text-subtitle-1 font-weight-bold mb-3">{{ $t('customers.recentBills') }}</div>
      <v-card border>
        <div v-if="!invoices.length" class="pa-8 text-center text-body-2 text-medium-emphasis">
          {{ $t('customers.noBillsYet') }}
        </div>
        <v-list v-else lines="two">
          <v-list-item
            v-for="invoice in invoices"
            :key="invoice.id"
            :to="{ name: 'invoice-detail', params: { id: invoice.id } }"
          >
            <v-list-item-title>{{ invoice.invoice_number }}</v-list-item-title>
            <v-list-item-subtitle>{{ new Date(invoice.issued_at).toLocaleString() }}</v-list-item-subtitle>
            <template #append>
              <span class="font-weight-medium mr-3">{{ invoice.currency }} {{ invoice.total_amount }}</span>
              <v-chip size="small" :color="invoice.status === 'cancelled' ? 'error' : 'default'" variant="tonal">
                {{ $t(`common.invoiceStatus.${invoice.status}`) }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </template>
  </v-container>
</template>
