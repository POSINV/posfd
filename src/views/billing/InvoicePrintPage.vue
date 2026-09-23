<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { BillingApi } from '@/api/billing'
import { BusinessesApi } from '@/api/businesses'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const auth = useAuthStore()

const invoice = ref(null)
const business = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const layout = ref('thermal') // 'a4' | 'compact' | 'thermal'

onMounted(async () => {
  try {
    ;[invoice.value, business.value] = await Promise.all([
      BillingApi.getInvoice(props.id),
      BusinessesApi.get(auth.currentBusinessId),
    ])
    layout.value = business.value.default_print_layout || 'thermal'
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
})

function print() {
  window.print()
}

// Only the thermal layout follows the business's configured roll width
// (58mm vs 80mm) - compact/A4 have their own fixed page sizes.
const thermalWidthStyle = computed(() => {
  if (layout.value !== 'thermal') return {}
  const width = business.value?.printer_paper_width === '58mm' ? '220px' : '300px'
  return { width }
})
</script>

<template>
  <div class="print-page">
    <div class="no-print toolbar">
      <v-btn icon="mdi-arrow-left" variant="text" @click="router.back()" />
      <v-btn-toggle v-model="layout" density="comfortable" mandatory class="mx-3">
        <v-btn value="thermal" size="small">Thermal</v-btn>
        <v-btn value="compact" size="small">Compact</v-btn>
        <v-btn value="a4" size="small">A4</v-btn>
      </v-btn-toggle>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-printer" @click="print">Print / Save PDF</v-btn>
    </div>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="ma-4">{{ errorMessage }}</v-alert>

    <div
      v-else
      class="sheet"
      :class="[`sheet--${layout}`, `sheet--font-${business.printer_font_size || 'normal'}`]"
      :style="thermalWidthStyle"
    >
      <div class="header" :style="{ textAlign: business.printer_header_align || 'center' }">
        <div class="business-name">{{ business.name }}</div>
        <div v-if="business.address" class="muted">{{ business.address }}</div>
        <div v-if="business.phone || business.email" class="muted">
          {{ [business.phone, business.email].filter(Boolean).join(' · ') }}
        </div>
        <div v-if="business.tax_number" class="muted">Tax No: {{ business.tax_number }}</div>
      </div>

      <div class="meta">
        <div>
          <div class="label">Invoice</div>
          <div class="value">{{ invoice.invoice_number }}</div>
        </div>
        <div>
          <div class="label">Date</div>
          <div class="value">{{ new Date(invoice.issued_at).toLocaleString() }}</div>
        </div>
        <div v-if="invoice.customer">
          <div class="label">Customer</div>
          <div class="value">{{ invoice.customer.name }}</div>
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th v-if="layout !== 'thermal'">Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in invoice.items" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.quantity }}</td>
            <td v-if="layout !== 'thermal'">{{ item.unit_price }}</td>
            <td>{{ item.line_total }}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>{{ invoice.subtotal }}</span></div>
        <div v-if="Number(invoice.discount_amount) > 0" class="row">
          <span>Discount</span><span>-{{ invoice.discount_amount }}</span>
        </div>
        <div class="row"><span>Tax</span><span>{{ invoice.tax_amount }}</span></div>
        <div class="row total"><span>Total</span><span>{{ invoice.currency }} {{ invoice.total_amount }}</span></div>
        <div class="row muted"><span>Paid</span><span>{{ invoice.amount_paid }}</span></div>
      </div>

      <div v-if="business.invoice_footer" class="footer">{{ business.invoice_footer }}</div>
      <div v-if="business.invoice_terms" class="terms">{{ business.invoice_terms }}</div>
    </div>
  </div>
</template>

<style scoped>
.print-page {
  min-height: 100vh;
  background: #f2f2f2;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.sheet {
  background: white;
  margin: 24px auto;
  padding: 32px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Courier New', monospace;
  color: #1f2430;
}

.sheet--a4 {
  width: 210mm;
  min-height: 297mm;
  font-family: system-ui, sans-serif;
}

.sheet--compact {
  width: 400px;
  font-family: system-ui, sans-serif;
}

.sheet--thermal {
  width: 300px;
  padding: 16px;
  font-size: 12px;
}

.sheet--font-small {
  font-size: 0.85em;
}

.sheet--font-large {
  font-size: 1.2em;
}

.header {
  text-align: center;
  margin-bottom: 16px;
}

.business-name {
  font-size: 1.25rem;
  font-weight: 700;
}

.muted {
  color: #6b7280;
  font-size: 0.85em;
}

.meta {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ccc;
}

.label {
  font-size: 0.75em;
  color: #6b7280;
}

.value {
  font-weight: 600;
}

.items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.items th,
.items td {
  text-align: left;
  padding: 4px 6px;
  font-size: 0.9em;
}

.items th:not(:first-child),
.items td:not(:first-child) {
  text-align: right;
}

.items thead tr {
  border-bottom: 1px solid #333;
}

.totals {
  margin-left: auto;
  width: 60%;
  min-width: 200px;
}

.totals .row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.totals .total {
  font-weight: 700;
  font-size: 1.1em;
  border-top: 1px solid #333;
  margin-top: 4px;
  padding-top: 4px;
}

.footer,
.terms {
  text-align: center;
  font-size: 0.8em;
  color: #6b7280;
  margin-top: 24px;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-page {
    background: white;
  }

  .sheet {
    box-shadow: none;
    margin: 0;
  }
}
</style>
