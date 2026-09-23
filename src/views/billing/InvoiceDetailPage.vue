<script setup>
import { ref, onMounted } from 'vue'
import { BillingApi } from '@/api/billing'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({ id: { type: String, required: true } })

const invoice = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const paymentDialogOpen = ref(false)
const paymentForm = ref({ method: 'cash', amount: '' })
const savingPayment = ref(false)

const cancelDialogOpen = ref(false)
const cancelling = ref(false)

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    invoice.value = await BillingApi.getInvoice(props.id)
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function balanceDue() {
  return (Number(invoice.value.total_amount) - Number(invoice.value.amount_paid)).toFixed(2)
}

function openPaymentDialog() {
  paymentForm.value = { method: 'cash', amount: balanceDue() }
  paymentDialogOpen.value = true
}

async function savePayment() {
  savingPayment.value = true
  try {
    invoice.value = await BillingApi.addPayment(invoice.value.id, paymentForm.value)
    paymentDialogOpen.value = false
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    savingPayment.value = false
  }
}

async function confirmCancel() {
  cancelling.value = true
  try {
    invoice.value = await BillingApi.cancelInvoice(invoice.value.id)
    cancelDialogOpen.value = false
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <div>
  <v-container max-width="720" class="py-8">
      <div class="d-flex align-center mb-6">
        <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'invoices' }" class="mr-2" />
        <h1 class="text-h5 font-weight-bold">Invoice</h1>
      </div>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else-if="invoice">
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

        <v-card class="pa-6 mb-6" border>
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <div class="text-h6 font-weight-bold">{{ invoice.invoice_number }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ new Date(invoice.issued_at).toLocaleString() }} · {{ invoice.customer?.name || 'Walk-in' }}
              </div>
            </div>
            <div class="d-flex ga-2">
              <v-chip size="small" :color="invoice.status === 'cancelled' ? 'error' : 'default'" variant="tonal">
                {{ invoice.status }}
              </v-chip>
              <v-chip
                size="small"
                :color="{ paid: 'success', partial: 'warning', unpaid: 'error' }[invoice.payment_status]"
                variant="tonal"
              >
                {{ invoice.payment_status }}
              </v-chip>
            </div>
          </div>

          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Tax</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in invoice.items" :key="item.id">
                <td>{{ item.name }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ item.unit_price }}</td>
                <td class="text-right">{{ item.discount_amount }}</td>
                <td class="text-right">{{ item.tax_amount }}</td>
                <td class="text-right">{{ item.line_total }}</td>
              </tr>
            </tbody>
          </v-table>

          <v-divider class="my-4" />

          <div class="d-flex justify-end">
            <div style="min-width: 240px">
              <div class="d-flex justify-space-between text-body-2">
                <span>Subtotal</span><span>{{ invoice.subtotal }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span>Discount</span><span>-{{ invoice.discount_amount }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span>Tax</span><span>{{ invoice.tax_amount }}</span>
              </div>
              <div class="d-flex justify-space-between text-h6 font-weight-bold mt-1">
                <span>Total</span><span>{{ invoice.currency }} {{ invoice.total_amount }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2 text-medium-emphasis mt-2">
                <span>Paid</span><span>{{ invoice.amount_paid }}</span>
              </div>
            </div>
          </div>
        </v-card>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">Payments</div>
          <div v-if="!invoice.payments.length" class="text-body-2 text-medium-emphasis">No payments recorded.</div>
          <v-list v-else density="comfortable">
            <v-list-item v-for="payment in invoice.payments" :key="payment.id">
              <v-list-item-title>{{ payment.method }} · {{ payment.amount }}</v-list-item-title>
              <v-list-item-subtitle>{{ new Date(payment.received_at).toLocaleString() }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <div class="d-flex ga-2">
          <v-btn
            id="print-invoice-btn"
            variant="tonal"
            prepend-icon="mdi-printer-outline"
            :to="{ name: 'invoice-print', params: { id: invoice.id } }"
          >
            Print / PDF
          </v-btn>
          <v-btn
            v-if="invoice.status !== 'cancelled' && invoice.payment_status !== 'paid'"
            id="add-payment-btn"
            color="primary"
            variant="tonal"
            @click="openPaymentDialog"
          >
            Record Payment
          </v-btn>
          <v-btn
            v-if="invoice.status !== 'cancelled'"
            id="cancel-invoice-btn"
            color="error"
            variant="tonal"
            @click="cancelDialogOpen = true"
          >
            Cancel Invoice
          </v-btn>
        </div>
      </template>
    </v-container>

    <v-dialog v-model="paymentDialogOpen" max-width="420">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">Record Payment</v-card-title>
        <v-card-text>
          <v-select
            v-model="paymentForm.method"
            :items="['cash', 'card', 'upi', 'credit', 'other']"
            label="Method"
            class="mb-2"
          />
          <v-text-field v-model="paymentForm.amount" label="Amount" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="paymentDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="savingPayment" @click="savePayment">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="cancelDialogOpen" max-width="420">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">Cancel this invoice?</v-card-title>
        <v-card-text>Stock for its items will be restored. This cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialogOpen = false">Back</v-btn>
          <v-btn color="error" :loading="cancelling" @click="confirmCancel">Cancel Invoice</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
