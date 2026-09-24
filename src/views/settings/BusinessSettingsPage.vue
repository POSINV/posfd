<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { BusinessesApi } from '@/api/businesses'
import { apiErrorMessage } from '@/api/client'
import { SUPPORTED_LOCALES, setLocale } from '@/plugins/i18n'

const auth = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const savedMessage = ref('')
const formErrors = ref({})

const form = ref({
  name: '',
  currency: '',
  timezone: '',
  language: '',
  address: '',
  phone: '',
  email: '',
  tax_number: '',
  invoice_prefix: '',
  invoice_footer: '',
  invoice_terms: '',
  printer_paper_width: '80mm',
  printer_header_align: 'center',
  printer_font_size: 'normal',
  default_print_layout: 'thermal',
})

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED']
const timezones = ['Asia/Kolkata', 'Asia/Dubai', 'America/New_York', 'Europe/London', 'UTC']
const languages = SUPPORTED_LOCALES.map((l) => ({ title: l.label, value: l.code }))

const paperWidths = [
  { title: '58mm thermal roll', value: '58mm' },
  { title: '80mm thermal roll', value: '80mm' },
  { title: 'A5 page', value: 'a5' },
  { title: 'A4 page', value: 'a4' },
  { title: 'Letter', value: 'letter' },
]
const alignments = [
  { title: 'Left', value: 'left' },
  { title: 'Center', value: 'center' },
  { title: 'Right', value: 'right' },
]
const fontSizes = [
  { title: 'Small', value: 'small' },
  { title: 'Normal', value: 'normal' },
  { title: 'Large (easier to read)', value: 'large' },
]
const printLayouts = [
  { title: 'Thermal receipt', value: 'thermal' },
  { title: 'Compact', value: 'compact' },
  { title: 'A4 invoice', value: 'a4' },
]

onMounted(load)

async function load() {
  loading.value = true
  try {
    const business = await BusinessesApi.get(auth.currentBusinessId)
    form.value = {
      name: business.name,
      currency: business.currency,
      timezone: business.timezone,
      language: business.language,
      address: business.address || '',
      phone: business.phone || '',
      email: business.email || '',
      tax_number: business.tax_number || '',
      invoice_prefix: business.invoice_prefix || 'INV-',
      invoice_footer: business.invoice_footer || '',
      invoice_terms: business.invoice_terms || '',
      printer_paper_width: business.printer_paper_width || '80mm',
      printer_header_align: business.printer_header_align || 'center',
      printer_font_size: business.printer_font_size || 'normal',
      default_print_layout: business.default_print_layout || 'thermal',
    }
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  errorMessage.value = ''
  savedMessage.value = ''
  formErrors.value = {}

  try {
    await BusinessesApi.update(auth.currentBusinessId, form.value)
    await auth.fetchCurrentUser()
    savedMessage.value = 'Settings saved.'
  } catch (error) {
    if (error?.response?.data?.errors) {
      formErrors.value = error.response.data.errors
    } else {
      errorMessage.value = apiErrorMessage(error)
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-container max-width="720" class="py-8">
      <h1 class="text-h5 font-weight-bold mb-1">Business Settings</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        Shown on printed invoices and used throughout the app.
      </p>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else @submit.prevent="save">
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
        <v-alert v-if="savedMessage" type="success" variant="tonal" class="mb-4">{{ savedMessage }}</v-alert>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">General</div>
          <v-text-field id="settings-name-input" v-model="form.name" label="Business name" :error-messages="formErrors.name" class="mb-2" />
          <v-row>
            <v-col cols="12" sm="4">
              <v-select id="settings-currency-select" v-model="form.currency" :items="currencies" label="Currency" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select id="settings-timezone-select" v-model="form.timezone" :items="timezones" label="Timezone" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                id="settings-language-select"
                v-model="form.language"
                :items="languages"
                label="Language"
                @update:model-value="setLocale"
              />
            </v-col>
          </v-row>
        </v-card>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">Invoice Header</div>
          <p class="text-caption text-medium-emphasis mb-3">Printed at the top of every invoice.</p>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field id="settings-phone-input" v-model="form.phone" label="Phone" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field id="settings-email-input" v-model="form.email" label="Email" />
            </v-col>
          </v-row>
          <v-text-field id="settings-address-input" v-model="form.address" label="Address" class="mb-2" />
          <v-text-field id="settings-tax-number-input" v-model="form.tax_number" label="Tax number (e.g. GSTIN)" />
        </v-card>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">Invoice Numbering &amp; Footer</div>
          <v-text-field
            id="settings-invoice-prefix-input"
            v-model="form.invoice_prefix"
            label="Invoice number prefix"
            hint="e.g. INV- produces INV-000123"
            persistent-hint
            class="mb-4"
          />
          <v-textarea id="settings-invoice-footer-input" v-model="form.invoice_footer" label="Footer message" rows="2" class="mb-2" />
          <v-textarea id="settings-invoice-terms-input" v-model="form.invoice_terms" label="Terms &amp; conditions" rows="2" />
        </v-card>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">Printer &amp; Receipt Layout</div>
          <p class="text-caption text-medium-emphasis mb-3">
            A clothing shop usually wants a quick 80mm receipt; a clinic or pharmacy often
            prints a fuller A4 bill with larger text. Set what fits your business - you can
            still switch per print.
          </p>
          <v-row>
            <v-col cols="12" sm="6">
              <v-select id="settings-print-layout-select" v-model="form.default_print_layout" :items="printLayouts" label="Default print layout" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select id="settings-paper-width-select" v-model="form.printer_paper_width" :items="paperWidths" label="Paper width" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select id="settings-header-align-select" v-model="form.printer_header_align" :items="alignments" label="Header alignment" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select id="settings-font-size-select" v-model="form.printer_font_size" :items="fontSizes" label="Font size" />
            </v-col>
          </v-row>
        </v-card>

        <div class="d-flex justify-space-between align-center">
          <v-btn
            id="view-audit-log-link"
            variant="text"
            prepend-icon="mdi-shield-search-outline"
            :to="{ name: 'audit-log' }"
          >
            View Audit Log
          </v-btn>
          <v-btn id="save-settings-btn" type="submit" color="primary" :loading="saving">Save Settings</v-btn>
        </div>
      </v-form>
    </v-container>
</template>
