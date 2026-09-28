<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { BillingApi } from '@/api/billing'
import { apiErrorMessage } from '@/api/client'

const { mobile } = useDisplay()
const { t } = useI18n()

const statusOptions = computed(() => [
  { title: t('invoices.statusAll'), value: null },
  { title: t('invoices.statusCompleted'), value: 'completed' },
  { title: t('invoices.statusCancelled'), value: 'cancelled' },
])
const invoices = ref([])
const pagination = ref({ page: 1, page_size: 25, total_count: 0 })
const page = ref(1)
const status = ref(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(load)
watch([page, status], load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await BillingApi.listInvoices({ page: page.value, status: status.value })
    invoices.value = result.data
    pagination.value = result.pagination
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function totalPages() {
  return Math.max(1, Math.ceil(pagination.value.total_count / pagination.value.page_size))
}

function paymentColor(s) {
  return { paid: 'success', partial: 'warning', unpaid: 'error' }[s] || 'default'
}
</script>

<template>
  <v-container class="py-8">
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-4">
        <div>
          <h1 class="text-h5 font-weight-bold">{{ $t('nav.invoices') }}</h1>
          <p class="text-body-2 text-medium-emphasis">{{ $t('invoices.count', { count: pagination.total_count }) }}</p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'billing' }">{{ $t('billing.newSale') }}</v-btn>
      </div>

      <v-select
        v-model="status"
        :items="statusOptions"
        :label="$t('products.table.status')"
        density="comfortable"
        style="max-width: 240px"
        class="mb-4"
      />

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-card v-else border>
        <div v-if="!invoices.length" class="pa-12 text-center">
          <v-icon icon="mdi-receipt-text-outline" size="40" color="medium-emphasis" class="mb-3" />
          <div class="text-body-1 font-weight-medium">{{ $t('invoices.emptyTitle') }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ $t('invoices.emptyHint') }}</div>
        </div>

        <div v-if="mobile">
          <div
            v-for="invoice in invoices"
            :key="invoice.id"
            :id="`invoice-row-${invoice.id}`"
            class="invoice-card-row pa-4"
            @click="$router.push({ name: 'invoice-detail', params: { id: invoice.id } })"
          >
            <div class="d-flex justify-space-between align-start">
              <div>
                <div class="font-weight-medium d-flex align-center ga-1">
                  {{ invoice.invoice_number }}
                  <v-chip v-if="invoice.source === 'migrated'" size="x-small" color="info" variant="tonal">{{ $t('invoices.migrated') }}</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ invoice.customer?.name || $t('dashboard.walkIn') }} ·
                  {{ new Date(invoice.issued_at).toLocaleDateString() }}
                </div>
              </div>
              <div class="text-right">
                <div class="font-weight-bold">{{ invoice.currency }} {{ invoice.total_amount }}</div>
              </div>
            </div>
            <div class="d-flex ga-2 mt-2">
              <v-chip size="small" :color="paymentColor(invoice.payment_status)" variant="tonal">
                {{ $t(`common.paymentStatus.${invoice.payment_status}`) }}
              </v-chip>
              <v-chip size="small" :color="invoice.status === 'cancelled' ? 'error' : 'default'" variant="tonal">
                {{ $t(`common.invoiceStatus.${invoice.status}`) }}
              </v-chip>
            </div>
          </div>
        </div>

        <v-table v-else>
          <thead>
            <tr>
              <th>{{ $t('invoices.invoiceHash') }}</th>
              <th>{{ $t('nav.customers') }}</th>
              <th>{{ $t('stockMovements.date') }}</th>
              <th>{{ $t('invoices.total') }}</th>
              <th>{{ $t('invoices.payment') }}</th>
              <th>{{ $t('products.table.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="invoice in invoices"
              :key="invoice.id"
              :id="`invoice-row-${invoice.id}`"
              style="cursor: pointer"
              @click="$router.push({ name: 'invoice-detail', params: { id: invoice.id } })"
            >
              <td class="font-weight-medium">
                <div class="d-flex align-center ga-1">
                  {{ invoice.invoice_number }}
                  <v-chip v-if="invoice.source === 'migrated'" size="x-small" color="info" variant="tonal">{{ $t('invoices.migrated') }}</v-chip>
                </div>
              </td>
              <td>{{ invoice.customer?.name || $t('dashboard.walkIn') }}</td>
              <td>{{ new Date(invoice.issued_at).toLocaleString() }}</td>
              <td>{{ invoice.currency }} {{ invoice.total_amount }}</td>
              <td>
                <v-chip size="small" :color="paymentColor(invoice.payment_status)" variant="tonal">
                  {{ $t(`common.paymentStatus.${invoice.payment_status}`) }}
                </v-chip>
              </td>
              <td>
                <v-chip size="small" :color="invoice.status === 'cancelled' ? 'error' : 'default'" variant="tonal">
                  {{ $t(`common.invoiceStatus.${invoice.status}`) }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="invoices.length" class="d-flex justify-center pa-4">
          <v-pagination v-model="page" :length="totalPages()" :total-visible="5" density="comfortable" />
        </div>
      </v-card>
    </v-container>
</template>

<style scoped>
.invoice-card-row {
  cursor: pointer;
}

.invoice-card-row + .invoice-card-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
