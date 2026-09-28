<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { OffersApi } from '@/api/offers'
import { apiErrorMessage } from '@/api/client'

const { t } = useI18n()
const offers = ref([])
const loading = ref(true)
const errorMessage = ref('')

const dialogOpen = ref(false)
const editingOffer = ref(null)
const form = ref(emptyForm())
const formErrors = ref({})
const saving = ref(false)

const discountTypes = computed(() => [
  { title: t('offers.percentageOff'), value: 'percentage' },
  { title: t('offers.fixedAmountOff'), value: 'fixed_amount' },
])
const segments = computed(() => [
  { title: t('common.segments.all'), value: 'all' },
  { title: t('common.segments.vip'), value: 'vip' },
  { title: t('common.segments.highValue'), value: 'high_value' },
  { title: t('common.segments.regular'), value: 'regular' },
  { title: t('common.segments.new'), value: 'new' },
  { title: t('common.segments.inactive'), value: 'inactive' },
])
const statusColors = { active: 'success', inactive: 'default' }

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    offers.value = await OffersApi.list()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function emptyForm() {
  return {
    name: '',
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '',
    eligible_segment: 'all',
    usage_limit_total: '',
    usage_limit_per_customer: '',
    starts_at: '',
    ends_at: '',
  }
}

function openCreate() {
  editingOffer.value = null
  form.value = emptyForm()
  formErrors.value = {}
  dialogOpen.value = true
}

function openEdit(offer) {
  editingOffer.value = offer
  form.value = {
    name: offer.name,
    code: offer.code || '',
    discount_type: offer.discount_type,
    discount_value: offer.discount_value,
    min_purchase_amount: offer.min_purchase_amount,
    eligible_segment: offer.eligible_segment,
    usage_limit_total: offer.usage_limit_total || '',
    usage_limit_per_customer: offer.usage_limit_per_customer || '',
    starts_at: offer.starts_at ? offer.starts_at.slice(0, 16) : '',
    ends_at: offer.ends_at ? offer.ends_at.slice(0, 16) : '',
    status: offer.status,
  }
  formErrors.value = {}
  dialogOpen.value = true
}

async function save() {
  saving.value = true
  formErrors.value = {}
  try {
    const payload = { ...form.value }
    if (!payload.code) delete payload.code
    if (!payload.usage_limit_total) delete payload.usage_limit_total
    if (!payload.usage_limit_per_customer) delete payload.usage_limit_per_customer
    if (payload.starts_at) payload.starts_at = new Date(payload.starts_at).toISOString()
    else delete payload.starts_at
    if (payload.ends_at) payload.ends_at = new Date(payload.ends_at).toISOString()
    else delete payload.ends_at

    if (editingOffer.value) {
      await OffersApi.update(editingOffer.value.id, payload)
    } else {
      await OffersApi.create(payload)
    }
    dialogOpen.value = false
    await load()
  } catch (error) {
    formErrors.value = error?.response?.data?.errors || {}
    if (!Object.keys(formErrors.value).length) errorMessage.value = apiErrorMessage(error)
  } finally {
    saving.value = false
  }
}

async function toggleStatus(offer) {
  errorMessage.value = ''
  try {
    await OffersApi.update(offer.id, { status: offer.status === 'active' ? 'inactive' : 'active' })
    await load()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
}
</script>

<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-4">
      <div>
        <h1 class="text-h5 font-weight-bold">{{ $t('nav.offers') }}</h1>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('offers.subtitle') }}
        </p>
      </div>
      <v-btn id="add-offer-btn" color="primary" prepend-icon="mdi-plus" @click="openCreate">{{ $t('offers.newOffer') }}</v-btn>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <v-card v-else border>
      <div v-if="!offers.length" class="pa-12 text-center text-body-2 text-medium-emphasis">
        {{ $t('offers.emptyHint') }}
      </div>
      <v-list v-else lines="two">
        <v-list-item v-for="offer in offers" :key="offer.id" @click="openEdit(offer)">
          <v-list-item-title class="d-flex align-center ga-2">
            {{ offer.name }}
            <v-chip v-if="offer.code" size="x-small" variant="tonal">{{ offer.code }}</v-chip>
            <v-chip v-else size="x-small" variant="tonal" color="info">{{ $t('offers.automatic') }}</v-chip>
            <v-chip size="x-small" :color="statusColors[offer.status]" variant="tonal">{{ $t(`common.productStatus.${offer.status}`) }}</v-chip>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ offer.discount_type === 'percentage' ? $t('offers.percentOffValue', { value: offer.discount_value }) : $t('offers.amountOffValue', { value: offer.discount_value }) }}
            &middot; {{ $t(`common.segments.${offer.eligible_segment === 'high_value' ? 'highValue' : offer.eligible_segment}`) }}
            <span v-if="offer.redemption_count !== undefined"> &middot; {{ $t('offers.redemptionsCount', { count: offer.redemption_count }) }}</span>
          </v-list-item-subtitle>
          <template #append>
            <v-btn size="small" variant="tonal" @click.stop="toggleStatus(offer)">
              {{ offer.status === 'active' ? $t('offers.deactivate') : $t('offers.activate') }}
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <v-dialog v-model="dialogOpen" max-width="560">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ editingOffer ? $t('offers.editOffer') : $t('offers.newOffer') }}</v-card-title>
        <v-card-text>
          <v-text-field id="offer-name-input" v-model="form.name" :label="$t('common.name')" :error-messages="formErrors.name" class="mb-2" />
          <v-text-field
            id="offer-code-input"
            v-model="form.code"
            :label="$t('offers.codeOptional')"
            :hint="$t('offers.codeHint')"
            persistent-hint
            class="mb-2"
          />
          <v-row>
            <v-col cols="12" sm="6">
              <v-select id="offer-discount-type-select" v-model="form.discount_type" :items="discountTypes" :label="$t('offers.discountType')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                id="offer-discount-value-input"
                v-model="form.discount_value"
                :label="form.discount_type === 'percentage' ? $t('offers.percentOff') : $t('offers.amountOff')"
                :error-messages="formErrors.discount_value"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field id="offer-min-purchase-input" v-model="form.min_purchase_amount" :label="$t('offers.minimumPurchase')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select id="offer-segment-select" v-model="form.eligible_segment" :items="segments" :label="$t('offers.eligibleCustomers')" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field id="offer-usage-limit-input" v-model="form.usage_limit_total" :label="$t('offers.totalUsageLimit')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field id="offer-per-customer-limit-input" v-model="form.usage_limit_per_customer" :label="$t('offers.perCustomerLimit')" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field id="offer-starts-at-input" v-model="form.starts_at" :label="$t('offers.startsOptional')" type="datetime-local" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field id="offer-ends-at-input" v-model="form.ends_at" :label="$t('offers.endsOptional')" type="datetime-local" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn id="save-offer-btn" color="primary" :loading="saving" @click="save">{{ $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
