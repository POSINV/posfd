<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CustomersApi } from '@/api/customers'
import { apiErrorMessage } from '@/api/client'

const router = useRouter()
const { t } = useI18n()

const rows = ref([])
const loading = ref(true)
const errorMessage = ref('')
const search = ref('')
const segmentFilter = ref(null)
let searchDebounce = null

const dialogOpen = ref(false)
const editingCustomer = ref(null)
const form = ref(emptyForm())
const formErrors = ref({})
const saving = ref(false)

const deleteTarget = ref(null)
const deleting = ref(false)

const segmentOptions = computed(() => [
  { title: t('common.segments.all'), value: null },
  { title: t('common.segments.vip'), value: 'vip' },
  { title: t('common.segments.highValue'), value: 'high_value' },
  { title: t('common.segments.regular'), value: 'regular' },
  { title: t('common.segments.new'), value: 'new' },
  { title: t('common.segments.inactive'), value: 'inactive' },
])

const segmentColors = { vip: 'purple', high_value: 'primary', regular: 'success', new: 'info', inactive: 'default' }
const segmentLabels = computed(() => ({
  vip: t('common.segments.vip'),
  high_value: t('common.segments.highValue'),
  regular: t('common.segments.regular'),
  new: t('common.segments.new'),
  inactive: t('common.segments.inactive'),
}))

const customerTypes = computed(() => [
  { title: t('customers.individual'), value: 'individual' },
  { title: t('customers.business'), value: 'business' },
])

onMounted(load)

watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(load, 300)
})
watch(segmentFilter, load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    rows.value = await CustomersApi.list({ search: search.value, segment: segmentFilter.value })
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function emptyForm() {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    date_of_birth: '',
    preferred_language: '',
    customer_type: 'individual',
    accepts_transactional_messages: true,
    accepts_promotional_messages: false,
  }
}

function openCreate() {
  editingCustomer.value = null
  form.value = emptyForm()
  formErrors.value = {}
  dialogOpen.value = true
}

function openEdit(customer) {
  editingCustomer.value = customer
  form.value = {
    name: customer.name,
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    notes: customer.notes || '',
    date_of_birth: customer.date_of_birth || '',
    preferred_language: customer.preferred_language || '',
    customer_type: customer.customer_type || 'individual',
    accepts_transactional_messages: customer.accepts_transactional_messages,
    accepts_promotional_messages: customer.accepts_promotional_messages,
  }
  formErrors.value = {}
  dialogOpen.value = true
}

async function save() {
  saving.value = true
  formErrors.value = {}
  try {
    if (editingCustomer.value) {
      await CustomersApi.update(editingCustomer.value.id, form.value)
    } else {
      await CustomersApi.create(form.value)
    }
    dialogOpen.value = false
    await load()
  } catch (error) {
    formErrors.value = error?.response?.data?.errors || {}
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    await CustomersApi.remove(deleteTarget.value.id)
    deleteTarget.value = null
    await load()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    deleting.value = false
  }
}

function openEditFromEvent(event, customer) {
  event.stopPropagation()
  openEdit(customer)
}

function openDeleteFromEvent(event, customer) {
  event.stopPropagation()
  deleteTarget.value = customer
}
</script>

<template>
  <div>
  <v-container class="py-8">
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-4">
        <div>
          <h1 class="text-h5 font-weight-bold">{{ $t('nav.customers') }}</h1>
          <p class="text-body-2 text-medium-emphasis">{{ $t('customers.subtitle') }}</p>
        </div>
        <v-btn id="add-customer-btn" color="primary" prepend-icon="mdi-plus" @click="openCreate">
          {{ $t('customers.addCustomer') }}
        </v-btn>
      </div>

      <div class="d-flex ga-3 flex-wrap mb-4">
        <v-text-field
          id="customer-search-input"
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          :placeholder="$t('customers.searchPlaceholder')"
          clearable
          hide-details
          style="max-width: 360px"
        />
        <v-select
          id="customer-segment-filter"
          v-model="segmentFilter"
          :items="segmentOptions"
          hide-details
          density="comfortable"
          style="max-width: 220px"
        />
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-card v-else border>
        <div v-if="!rows.length" id="customers-empty" class="pa-12 text-center">
          <v-icon icon="mdi-account-outline" size="40" color="medium-emphasis" class="mb-3" />
          <div class="text-body-1 font-weight-medium">{{ $t('customers.emptyTitle') }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ $t('customers.emptyHint') }}</div>
        </div>

        <v-list v-else lines="two">
          <v-list-item
            v-for="customer in rows"
            :key="customer.id"
            :id="`customer-row-${customer.id}`"
            @click="router.push({ name: 'customer-detail', params: { id: customer.id } })"
          >
            <v-list-item-title class="d-flex align-center ga-2">
              {{ customer.name }}
              <v-chip size="x-small" :color="segmentColors[customer.segment]" variant="tonal">
                {{ segmentLabels[customer.segment] || customer.segment }}
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ [customer.phone, customer.email].filter(Boolean).join(' · ') || $t('customers.noContactInfo') }}
              &middot; {{ $t('customers.visitsCount', { count: customer.visit_count }) }}
              &middot; {{ $t('customers.spentAmount', { amount: customer.total_spent }) }}
            </v-list-item-subtitle>
            <template #append>
              <v-chip v-if="Number(customer.outstanding_balance) > 0" size="small" color="warning" variant="tonal" class="mr-2">
                {{ $t('customers.dueAmount', { amount: customer.outstanding_balance }) }}
              </v-chip>
              <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="openEditFromEvent($event, customer)" />
              <v-btn
                icon="mdi-trash-can-outline"
                variant="text"
                size="small"
                color="error"
                @click="openDeleteFromEvent($event, customer)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-container>

    <v-dialog v-model="dialogOpen" max-width="560">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ editingCustomer ? $t('customers.editCustomer') : $t('customers.addCustomer') }}</v-card-title>
        <v-card-text>
          <v-text-field id="customer-name-input" v-model="form.name" :label="$t('common.name')" :error-messages="formErrors.name" class="mb-2" autofocus />
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field id="customer-phone-input" v-model="form.phone" :label="$t('common.phone')" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field id="customer-email-input" v-model="form.email" :label="$t('common.email')" :error-messages="formErrors.email" />
            </v-col>
          </v-row>
          <v-text-field id="customer-address-input" v-model="form.address" :label="$t('customers.addressOptional')" class="mb-2" />
          <v-row>
            <v-col cols="12" sm="4">
              <v-select id="customer-type-select" v-model="form.customer_type" :items="customerTypes" :label="$t('customers.customerType')" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field id="customer-dob-input" v-model="form.date_of_birth" :label="$t('customers.dateOfBirth')" type="date" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field id="customer-language-input" v-model="form.preferred_language" :label="$t('customers.preferredLanguage')" :hint="$t('customers.preferredLanguageHint')" />
            </v-col>
          </v-row>
          <v-textarea id="customer-notes-input" v-model="form.notes" :label="$t('common.notesOptional')" rows="2" class="mb-2" />

          <div class="text-caption text-medium-emphasis mb-1">{{ $t('customers.communicationPreferences') }}</div>
          <v-checkbox
            id="customer-transactional-checkbox"
            v-model="form.accepts_transactional_messages"
            :label="$t('customers.allowTransactional')"
            density="compact"
            hide-details
          />
          <v-checkbox
            id="customer-promotional-checkbox"
            v-model="form.accepts_promotional_messages"
            :label="$t('customers.allowPromotional')"
            density="compact"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn id="save-customer-btn" color="primary" :loading="saving" @click="save">{{ $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="!!deleteTarget" max-width="420" @update:model-value="deleteTarget = null">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('customers.deleteTitle') }}</v-card-title>
        <v-card-text>{{ $t('customers.deleteConfirm', { name: deleteTarget?.name }) }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTarget = null">{{ $t('common.cancel') }}</v-btn>
          <v-btn id="confirm-delete-customer-btn" color="error" :loading="deleting" @click="confirmDelete">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
