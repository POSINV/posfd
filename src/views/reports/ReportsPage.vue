<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ReportsApi } from '@/api/reports'
import { apiErrorMessage } from '@/api/client'
import DateRangePicker from '@/components/reports/DateRangePicker.vue'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart.vue'

const auth = useAuthStore()

const today = new Date().toISOString().slice(0, 10)
const range = ref({ from: today, to: today })

const summary = ref(null)
const dailySales = ref([])
const topProducts = ref([])
const stockItems = ref([])
const lowStockOnly = ref(false)

const loading = ref(true)
const errorMessage = ref('')

onMounted(loadAll)
watch(range, loadAll, { deep: true })
watch(lowStockOnly, loadStock)

async function loadAll() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [summaryResult, dailyResult, topProductsResult] = await Promise.all([
      ReportsApi.salesSummary(range.value.from, range.value.to),
      ReportsApi.dailySales(range.value.from, range.value.to),
      ReportsApi.topProducts(range.value.from, range.value.to),
    ])
    summary.value = summaryResult
    dailySales.value = dailyResult
    topProducts.value = topProductsResult
    await loadStock()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function loadStock() {
  stockItems.value = await ReportsApi.stock(lowStockOnly.value)
}

function currency(amount) {
  return `${auth.currentBusiness?.currency || ''} ${amount}`
}
</script>

<template>
  <v-container class="py-8">
      <h1 class="text-h5 font-weight-bold mb-4">Reports</h1>

      <DateRangePicker v-model="range" class="mb-6" />

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else-if="summary">
        <v-card class="pa-4 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">Sales Trend</div>
          <SalesTrendChart :days="dailySales" :currency="auth.currentBusiness?.currency" />
        </v-card>

        <v-row class="mb-2">
          <v-col cols="6" sm="3">
            <v-card class="pa-4" border>
              <div class="text-caption text-medium-emphasis">Revenue</div>
              <div class="text-h6 font-weight-bold">{{ currency(summary.revenue) }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="pa-4" border>
              <div class="text-caption text-medium-emphasis">Invoices</div>
              <div class="text-h6 font-weight-bold">{{ summary.invoice_count }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="pa-4" border>
              <div class="text-caption text-medium-emphasis">Average Sale</div>
              <div class="text-h6 font-weight-bold">{{ currency(summary.average_sale) }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" sm="3">
            <v-card class="pa-4" border>
              <div class="text-caption text-medium-emphasis">Tax Collected</div>
              <div class="text-h6 font-weight-bold">{{ currency(summary.tax) }}</div>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-card class="pa-4 mb-6" border>
              <div class="text-subtitle-1 font-weight-bold mb-3">Payment Methods</div>
              <div v-if="!Object.keys(summary.by_payment_method).length" class="text-body-2 text-medium-emphasis">
                No payments in this range.
              </div>
              <div v-for="(amount, method) in summary.by_payment_method" :key="method" class="d-flex justify-space-between text-body-2 mb-1">
                <span class="text-capitalize">{{ method }}</span>
                <span>{{ currency(amount) }}</span>
              </div>
            </v-card>

            <v-card class="pa-4" border>
              <div class="text-subtitle-1 font-weight-bold mb-3">Top Products</div>
              <div v-if="!topProducts.length" class="text-body-2 text-medium-emphasis">No sales in this range.</div>
              <v-table v-else density="comfortable">
                <thead>
                  <tr><th>Product</th><th class="text-right">Qty Sold</th><th class="text-right">Revenue</th></tr>
                </thead>
                <tbody>
                  <tr v-for="p in topProducts" :key="p.name">
                    <td>{{ p.name }}</td>
                    <td class="text-right">{{ p.quantity_sold }}</td>
                    <td class="text-right">{{ currency(p.revenue) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="pa-4" border>
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-subtitle-1 font-weight-bold">Current Stock</div>
                <v-switch v-model="lowStockOnly" label="Low stock only" density="compact" hide-details color="warning" />
              </div>
              <div v-if="!stockItems.length" class="text-body-2 text-medium-emphasis">No items to show.</div>
              <v-table v-else density="comfortable">
                <thead>
                  <tr><th>Item</th><th class="text-right">Stock</th><th class="text-right">Reorder Level</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in stockItems" :key="item.id">
                    <td>
                      {{ item.name }}
                      <v-icon v-if="item.low_stock" icon="mdi-alert-circle" color="warning" size="16" class="ml-1" />
                    </td>
                    <td class="text-right">{{ item.stock_quantity }}</td>
                    <td class="text-right">{{ item.reorder_level }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </v-container>
</template>
