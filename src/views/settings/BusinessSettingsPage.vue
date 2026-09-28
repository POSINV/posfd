<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { BusinessesApi } from '@/api/businesses'
import { LoyaltyApi } from '@/api/loyalty'
import { apiErrorMessage } from '@/api/client'
import { SUPPORTED_LOCALES, setLocale } from '@/plugins/i18n'

const auth = useAuthStore()
const { t } = useI18n()

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

const paperWidths = computed(() => [
  { title: t('settings.paperWidths.58mm'), value: '58mm' },
  { title: t('settings.paperWidths.80mm'), value: '80mm' },
  { title: t('settings.paperWidths.a5'), value: 'a5' },
  { title: t('settings.paperWidths.a4'), value: 'a4' },
  { title: t('settings.paperWidths.letter'), value: 'letter' },
])
const alignments = computed(() => [
  { title: t('settings.left'), value: 'left' },
  { title: t('settings.center'), value: 'center' },
  { title: t('settings.right'), value: 'right' },
])
const fontSizes = computed(() => [
  { title: t('settings.fontSizes.small'), value: 'small' },
  { title: t('settings.fontSizes.normal'), value: 'normal' },
  { title: t('settings.fontSizes.large'), value: 'large' },
])
const printLayouts = computed(() => [
  { title: t('settings.printLayouts.thermal'), value: 'thermal' },
  { title: t('settings.printLayouts.compact'), value: 'compact' },
  { title: t('settings.printLayouts.a4'), value: 'a4' },
])

const loyaltyForm = ref(null)
const loyaltyActive = ref(false)
const loyaltySaving = ref(false)
const loyaltyErrorMessage = ref('')
const loyaltySavedMessage = ref('')

onMounted(load)

async function load() {
  loading.value = true
  try {
    const [business, program] = await Promise.all([
      BusinessesApi.get(auth.currentBusinessId),
      LoyaltyApi.getProgram(),
    ])
    loyaltyForm.value = program
    loyaltyActive.value = program.active
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
    savedMessage.value = t('settings.settingsSaved')
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

async function saveLoyalty() {
  loyaltySaving.value = true
  loyaltyErrorMessage.value = ''
  loyaltySavedMessage.value = ''

  try {
    const program = await LoyaltyApi.updateProgram(loyaltyForm.value)
    loyaltyForm.value = program
    loyaltyActive.value = program.active
    loyaltySavedMessage.value = t('settings.loyaltyProgramSaved')
  } catch (error) {
    loyaltyErrorMessage.value = apiErrorMessage(error)
  } finally {
    loyaltySaving.value = false
  }
}
</script>

<template>
  <v-container max-width="720" class="py-8">
      <h1 class="text-h5 font-weight-bold mb-1">{{ $t('nav.businessSettings') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        {{ $t('settings.subtitle') }}
      </p>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-form v-else @submit.prevent="save">
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
        <v-alert v-if="savedMessage" type="success" variant="tonal" class="mb-4">{{ savedMessage }}</v-alert>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ $t('settings.general') }}</div>
          <v-text-field id="settings-name-input" v-model="form.name" :label="$t('settings.businessName')" :error-messages="formErrors.name" class="mb-2" />
          <v-row>
            <v-col cols="12" sm="4">
              <v-select id="settings-currency-select" v-model="form.currency" :items="currencies" :label="$t('settings.currency')" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select id="settings-timezone-select" v-model="form.timezone" :items="timezones" :label="$t('settings.timezone')" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                id="settings-language-select"
                v-model="form.language"
                :items="languages"
                :label="$t('onboarding.language')"
                @update:model-value="setLocale"
              />
            </v-col>
          </v-row>
        </v-card>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ $t('settings.invoiceHeader') }}</div>
          <p class="text-caption text-medium-emphasis mb-3">{{ $t('settings.invoiceHeaderHint') }}</p>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field id="settings-phone-input" v-model="form.phone" :label="$t('common.phone')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field id="settings-email-input" v-model="form.email" :label="$t('common.email')" />
            </v-col>
          </v-row>
          <v-text-field id="settings-address-input" v-model="form.address" :label="$t('common.address')" class="mb-2" />
          <v-text-field id="settings-tax-number-input" v-model="form.tax_number" :label="$t('settings.taxNumber')" />
        </v-card>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ $t('settings.invoiceNumberingFooter') }}</div>
          <v-text-field
            id="settings-invoice-prefix-input"
            v-model="form.invoice_prefix"
            :label="$t('settings.invoiceNumberPrefix')"
            :hint="$t('settings.invoiceNumberPrefixHint')"
            persistent-hint
            class="mb-4"
          />
          <v-textarea id="settings-invoice-footer-input" v-model="form.invoice_footer" :label="$t('settings.footerMessage')" rows="2" class="mb-2" />
          <v-textarea id="settings-invoice-terms-input" v-model="form.invoice_terms" :label="$t('settings.termsAndConditions')" rows="2" />
        </v-card>

        <v-card class="pa-6 mb-6" border>
          <div class="text-subtitle-1 font-weight-bold mb-3">{{ $t('settings.printerReceiptLayout') }}</div>
          <p class="text-caption text-medium-emphasis mb-3">
            {{ $t('settings.printerReceiptLayoutHint') }}
          </p>
          <v-row>
            <v-col cols="12" sm="6">
              <v-select id="settings-print-layout-select" v-model="form.default_print_layout" :items="printLayouts" :label="$t('settings.defaultPrintLayout')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select id="settings-paper-width-select" v-model="form.printer_paper_width" :items="paperWidths" :label="$t('settings.paperWidth')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select id="settings-header-align-select" v-model="form.printer_header_align" :items="alignments" :label="$t('settings.headerAlignment')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select id="settings-font-size-select" v-model="form.printer_font_size" :items="fontSizes" :label="$t('settings.fontSize')" />
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
            {{ $t('settings.viewAuditLog') }}
          </v-btn>
          <v-btn id="save-settings-btn" type="submit" color="primary" :loading="saving">{{ $t('settings.saveSettings') }}</v-btn>
        </div>
      </v-form>

      <v-card v-if="loyaltyForm" class="pa-6 mb-6 mt-6" border>
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-subtitle-1 font-weight-bold">{{ $t('settings.loyaltyProgram') }}</div>
          <v-chip v-if="loyaltyForm.enabled && !loyaltyActive" size="small" color="warning" variant="tonal">
            {{ $t('settings.enabledNotOnPlan') }}
          </v-chip>
        </div>
        <p class="text-caption text-medium-emphasis mb-3">
          {{ $t('settings.loyaltyProgramHint') }}
        </p>

        <v-alert v-if="loyaltyErrorMessage" type="error" variant="tonal" class="mb-3">{{ loyaltyErrorMessage }}</v-alert>
        <v-alert v-if="loyaltySavedMessage" type="success" variant="tonal" class="mb-3">{{ loyaltySavedMessage }}</v-alert>

        <v-switch
          id="loyalty-enabled-switch"
          v-model="loyaltyForm.enabled"
          :label="$t('settings.enableLoyaltyPoints')"
          color="primary"
          hide-details
          class="mb-3"
        />

        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              id="loyalty-earn-amount-input"
              v-model="loyaltyForm.earn_amount_per_point"
              :label="$t('settings.earnAmount')"
              :hint="$t('settings.earnAmountHint')"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              id="loyalty-redeem-value-input"
              v-model="loyaltyForm.redeem_value_per_point"
              :label="$t('settings.redeemValue')"
              :hint="$t('settings.redeemValueHint')"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              id="loyalty-min-redeem-input"
              v-model="loyaltyForm.min_redeem_points"
              :label="$t('settings.minRedeemPoints')"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              id="loyalty-max-redemption-input"
              v-model="loyaltyForm.max_redemption_percentage"
              :label="$t('settings.maxRedemptionPercentage')"
            />
          </v-col>
        </v-row>

        <div class="d-flex justify-end">
          <v-btn id="save-loyalty-btn" color="primary" :loading="loyaltySaving" @click="saveLoyalty">
            {{ $t('settings.saveLoyaltySettings') }}
          </v-btn>
        </div>
      </v-card>
    </v-container>
</template>
