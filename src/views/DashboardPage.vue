<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ReportsApi } from '@/api/reports'
import { BillingApi } from '@/api/billing'
import { apiErrorMessage } from '@/api/client'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart.vue'

const auth = useAuthStore()

const loading = ref(true)
const errorMessage = ref('')

const todaySummary = ref(null)
const weekDays = ref([])
const topProducts = ref([])
const recentInvoices = ref([])
const lowStockItems = ref([])

const today = new Date().toISOString().slice(0, 10)
const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)

const hasAnyProducts = ref(true)

onMounted(async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [summary, days, top, invoices, stock] = await Promise.all([
      ReportsApi.salesSummary(today, today),
      ReportsApi.dailySales(weekStart, today),
      ReportsApi.topProducts(weekStart, today, 5),
      BillingApi.listInvoices({ page: 1, page_size: 5 }),
      ReportsApi.stock(true),
    ])
    todaySummary.value = summary
    weekDays.value = days || []
    topProducts.value = top
    recentInvoices.value = invoices.data
    lowStockItems.value = stock

    const allStock = await ReportsApi.stock(false)
    hasAnyProducts.value = allStock.length > 0
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
})

const weekTotal = computed(() =>
  weekDays.value.reduce((sum, d) => sum + Number(d.revenue || 0), 0),
)

function currency(amount) {
  return `${auth.currentBusiness?.currency || ''} ${amount}`
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function paymentColor(s) {
  return { paid: 'success', partial: 'warning', unpaid: 'error' }[s] || 'default'
}
</script>

<template>
  <v-container class="py-6 py-md-8">
      <div class="d-flex align-start justify-space-between flex-wrap ga-4 mb-6">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">{{ greeting() }}, {{ auth.user?.full_name?.split(' ')[0] }}</h1>
          <p class="text-body-2 text-medium-emphasis">
            Here's how {{ auth.currentBusiness?.name }} is doing today.
          </p>
        </div>
        <v-btn color="primary" size="large" prepend-icon="mdi-point-of-sale" :to="{ name: 'billing' }">
          New Sale
        </v-btn>
      </div>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <template v-else-if="!hasAnyProducts">
        <v-card class="pa-10 text-center hover-lift" border>
          <v-icon icon="mdi-rocket-launch-outline" size="48" color="primary" class="mb-4" />
          <div class="text-h6 font-weight-bold mb-1">Let's get {{ auth.currentBusiness?.name }} selling</div>
          <div class="text-body-2 text-medium-emphasis mb-6">
            Add your first product to start managing inventory and billing.
          </div>
          <v-btn color="primary" size="large" :to="{ name: 'product-new' }">Add Your First Product</v-btn>
        </v-card>
      </template>

      <template v-else>
        <v-row class="mb-2">
          <v-col cols="6" md="3">
            <v-card class="pa-4 stat-card stat-card--primary hover-lift" border>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption text-medium-emphasis">Today's Sales</span>
                <v-icon icon="mdi-cash-multiple" size="18" color="primary" />
              </div>
              <div class="text-h5 font-weight-bold">{{ currency(todaySummary?.revenue ?? '0.00') }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="pa-4 stat-card hover-lift" border>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption text-medium-emphasis">Invoices Today</span>
                <v-icon icon="mdi-receipt-text-outline" size="18" color="secondary" />
              </div>
              <div class="text-h5 font-weight-bold">{{ todaySummary?.invoice_count ?? 0 }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="pa-4 stat-card hover-lift" :class="{ 'stat-card--warning': lowStockItems.length }" border>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption text-medium-emphasis">Low Stock</span>
                <v-icon icon="mdi-alert-circle-outline" size="18" :color="lowStockItems.length ? 'warning' : 'medium-emphasis'" />
              </div>
              <div class="text-h5 font-weight-bold">{{ lowStockItems.length }}</div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="pa-4 stat-card hover-lift" border>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption text-medium-emphasis">This Week</span>
                <v-icon icon="mdi-trending-up" size="18" color="success" />
              </div>
              <div class="text-h5 font-weight-bold">{{ currency(weekTotal.toFixed(2)) }}</div>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="8">
            <v-card class="pa-5 mb-6" border>
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="text-subtitle-1 font-weight-bold">Sales - Last 7 Days</div>
                <v-btn size="small" variant="text" :to="{ name: 'reports' }" append-icon="mdi-arrow-right">
                  Full Reports
                </v-btn>
              </div>
              <SalesTrendChart :days="weekDays" :currency="auth.currentBusiness?.currency" />
            </v-card>

            <v-card class="pa-5" border>
              <div class="text-subtitle-1 font-weight-bold mb-3">Recent Invoices</div>
              <div v-if="!recentInvoices.length" class="text-body-2 text-medium-emphasis text-center py-6">
                No sales yet today.
              </div>
              <v-list v-else lines="two" class="pa-0">
                <v-list-item
                  v-for="invoice in recentInvoices"
                  :key="invoice.id"
                  :to="{ name: 'invoice-detail', params: { id: invoice.id } }"
                  class="px-0"
                >
                  <v-list-item-title class="font-weight-medium">{{ invoice.invoice_number }}</v-list-item-title>
                  <v-list-item-subtitle>{{ invoice.customer?.name || 'Walk-in' }}</v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="font-weight-bold">{{ currency(invoice.total_amount) }}</div>
                      <v-chip size="x-small" :color="paymentColor(invoice.payment_status)" variant="tonal">
                        {{ invoice.payment_status }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="pa-5 mb-6" border>
              <div class="text-subtitle-1 font-weight-bold mb-3">Top Products This Week</div>
              <div v-if="!topProducts.length" class="text-body-2 text-medium-emphasis text-center py-6">
                No sales yet this week.
              </div>
              <div v-for="(p, i) in topProducts" :key="p.name" class="d-flex align-center mb-3">
                <div class="rank-badge mr-3">{{ i + 1 }}</div>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">{{ p.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ p.quantity_sold }} sold</div>
                </div>
                <div class="text-body-2 font-weight-bold">{{ currency(p.revenue) }}</div>
              </div>
            </v-card>

            <v-card class="pa-5 mb-6" border>
              <div class="text-subtitle-1 font-weight-bold mb-3">Quick Actions</div>
              <v-btn variant="tonal" color="primary" block class="mb-2 justify-start" prepend-icon="mdi-plus" :to="{ name: 'product-new' }">
                Add Product
              </v-btn>
              <v-btn variant="tonal" block class="mb-2 justify-start" prepend-icon="mdi-account-plus-outline" :to="{ name: 'customers' }">
                Add Customer
              </v-btn>
              <v-btn variant="tonal" block class="justify-start" prepend-icon="mdi-cog-outline" :to="{ name: 'settings' }">
                Business Settings
              </v-btn>
            </v-card>

            <v-card v-if="lowStockItems.length" class="pa-5" border color="warning" variant="tonal">
              <div class="d-flex align-center mb-2">
                <v-icon icon="mdi-alert-circle-outline" class="mr-2" />
                <div class="text-subtitle-1 font-weight-bold">Low Stock Alert</div>
              </div>
              <div v-for="item in lowStockItems.slice(0, 4)" :key="item.id" class="text-body-2 d-flex justify-space-between py-1">
                <span>{{ item.name }}</span>
                <span class="font-weight-bold">{{ item.stock_quantity }} left</span>
              </div>
              <v-btn size="small" variant="text" class="mt-2" :to="{ name: 'reports' }">View all</v-btn>
            </v-card>
          </v-col>
        </v-row>
      </template>
  </v-container>
</template>

<style scoped>
.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card--primary {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(79, 70, 229, 0));
}

.stat-card--warning {
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.08), rgba(217, 119, 6, 0));
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary-lighten-1));
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
