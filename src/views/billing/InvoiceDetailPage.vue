<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { BillingApi } from '@/api/billing'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({ id: { type: String, required: true } })
const { t } = useI18n()

const paymentMethodOptions = computed(() => [
  { title: t('billing.cart.paymentMethods.cash'), value: 'cash' },
  { title: t('billing.cart.paymentMethods.card'), value: 'card' },
  { title: t('billing.cart.paymentMethods.upi'), value: 'upi' },
  { title: t('billing.cart.paymentMethods.credit'), value: 'credit' },
  { title: t('billing.cart.paymentMethods.other'), value: 'other' },
])

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
        <h1 class="text-h5 font-weight-bold">{{ $t('invoices.invoice') }}</h1>
      </div>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else-if="invoice">
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

        <v-card class="pa-6 mb-6" border>
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <div class="text-h6 font-weight-bold d-flex align-center ga-2">
                {{ invoice.invoice_number }}
                <v-chip v-if="invoice.source === 'migrated'" size="small" color="info" variant="tonal">{{ $t('invoices.migrated') }}</v-chip>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ new Date(invoice.issued_at).toLocaleString() }} · {{ invoice.customer?.name || $t('dashboard.walkIn') }}
              </div>
            </div>
            <div class="d-flex ga-2">
              <v-chip size="small" :color="invoice.status === 'cancelled' ? 'error' : 'default'" variant="tonal">
                {{ $t(`common.invoiceStatus.${invoice.status}`) }}
              </v-chip>
              <v-chip
                size="small"
                :color="{ paid: 'success', partial: 'warning', unpaid: 'error' }[invoice.payment_status]"
                variant="tonal"
              >
                {{ $t(`common.paymentStatus.${invoice.payment_status}`) }}
              </v-chip>
            </div>
          </div>

          <v-table density="comfortable">
            <thead>
              <tr>
                <th>{{ $t('invoices.item') }}</th>
                <th class="text-right">{{ $t('stockMovements.qty') }}</th>
                <th class="text-right">{{ $t('invoices.unitPrice') }}</th>
                <th class="text-right">{{ $t('billing.cart.discount') }}</th>
                <th class="text-right">{{ $t('billing.cart.tax') }}</th>
                <th class="text-right">{{ $t('billing.cart.total') }}</th>
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
                <span>{{ $t('billing.cart.subtotal') }}</span><span>{{ invoice.subtotal }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span>{{ $t('billing.cart.discount') }}</span><span>-{{ invoice.discount_amount }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span>{{ $t('billing.cart.tax') }}</span><span>{{ invoice.tax_amount }}</span>
              </div>
              <div class="d-flex justify-space-between text-h6 font-weight-bold mt-1">
                <span>{{ $t('billing.cart.total') }}</span><span>{{ invoice.currency }} {{ invoice.total_amount }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2 text-medium-emphasis mt-2">
                <span>{{ $t('invoices.paid') }}</span><span>{{ invoice.amount_paid }}</span>
              </div>
            </div>
          </div>
        </v-card>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ $t('invoices.payments') }}</div>
          <div v-if="!invoice.payments.length" class="text-body-2 text-medium-emphasis">{{ $t('invoices.noPaymentsRecorded') }}</div>
          <v-list v-else density="comfortable">
            <v-list-item v-for="payment in invoice.payments" :key="payment.id">
              <v-list-item-title>{{ $t(`billing.cart.paymentMethods.${payment.method}`) }} · {{ payment.amount }}</v-list-item-title>
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
            {{ $t('invoices.printPdf') }}
          </v-btn>
          <v-btn
            v-if="invoice.status !== 'cancelled' && invoice.payment_status !== 'paid'"
            id="add-payment-btn"
            color="primary"
            variant="tonal"
            @click="openPaymentDialog"
          >
            {{ $t('invoices.recordPayment') }}
          </v-btn>
          <v-btn
            v-if="invoice.status !== 'cancelled'"
            id="cancel-invoice-btn"
            color="error"
            variant="tonal"
            @click="cancelDialogOpen = true"
          >
            {{ $t('invoices.cancelInvoice') }}
          </v-btn>
        </div>
      </template>
    </v-container>

    <v-dialog v-model="paymentDialogOpen" max-width="420">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('invoices.recordPayment') }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="paymentForm.method"
            :items="paymentMethodOptions"
            :label="$t('invoices.method')"
            class="mb-2"
          />
          <v-text-field v-model="paymentForm.amount" :label="$t('invoices.amount')" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="paymentDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="savingPayment" @click="savePayment">{{ $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="cancelDialogOpen" max-width="420">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('invoices.cancelConfirmTitle') }}</v-card-title>
        <v-card-text>
          <template v-if="invoice?.source === 'migrated'">
            {{ $t('invoices.cancelMigratedHint') }}
          </template>
          <template v-else>{{ $t('invoices.cancelHint') }}</template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialogOpen = false">{{ $t('common.back') }}</v-btn>
          <v-btn color="error" :loading="cancelling" @click="confirmCancel">{{ $t('invoices.cancelInvoice') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
