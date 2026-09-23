<script setup>
import { ref, onMounted, watch } from 'vue'
import { CustomersApi } from '@/api/customers'
import { apiErrorMessage } from '@/api/client'

const customers = ref([])
const loading = ref(true)
const errorMessage = ref('')
const search = ref('')
let searchDebounce = null

const dialogOpen = ref(false)
const editingCustomer = ref(null)
const form = ref({ name: '', phone: '', email: '', address: '', notes: '' })
const formErrors = ref({})
const saving = ref(false)

const deleteTarget = ref(null)
const deleting = ref(false)

onMounted(load)

watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(load, 300)
})

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    customers.value = await CustomersApi.list({ search: search.value })
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function emptyForm() {
  return { name: '', phone: '', email: '', address: '', notes: '' }
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
</script>

<template>
  <div>
  <v-container class="py-8">
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-4">
        <div>
          <h1 class="text-h5 font-weight-bold">Customers</h1>
          <p class="text-body-2 text-medium-emphasis">Registered customers for faster billing and history</p>
        </div>
        <v-btn id="add-customer-btn" color="primary" prepend-icon="mdi-plus" @click="openCreate">
          Add Customer
        </v-btn>
      </div>

      <v-text-field
        id="customer-search-input"
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search by name, phone, or email"
        clearable
        class="mb-4"
        style="max-width: 420px"
      />

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-card v-else border>
        <div v-if="!customers.length" id="customers-empty" class="pa-12 text-center">
          <v-icon icon="mdi-account-outline" size="40" color="medium-emphasis" class="mb-3" />
          <div class="text-body-1 font-weight-medium">No customers yet</div>
          <div class="text-body-2 text-medium-emphasis">Add a customer to speed up repeat billing.</div>
        </div>

        <v-list v-else lines="two">
          <v-list-item v-for="customer in customers" :key="customer.id" :id="`customer-row-${customer.id}`">
            <v-list-item-title>{{ customer.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ [customer.phone, customer.email].filter(Boolean).join(' · ') || 'No contact info' }}
            </v-list-item-subtitle>
            <template #append>
              <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="openEdit(customer)" />
              <v-btn
                icon="mdi-trash-can-outline"
                variant="text"
                size="small"
                color="error"
                @click="deleteTarget = customer"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-container>

    <v-dialog v-model="dialogOpen" max-width="520">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ editingCustomer ? 'Edit Customer' : 'Add Customer' }}</v-card-title>
        <v-card-text>
          <v-text-field id="customer-name-input" v-model="form.name" label="Name" :error-messages="formErrors.name" class="mb-2" autofocus />
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field id="customer-phone-input" v-model="form.phone" label="Phone" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field id="customer-email-input" v-model="form.email" label="Email" :error-messages="formErrors.email" />
            </v-col>
          </v-row>
          <v-text-field id="customer-address-input" v-model="form.address" label="Address (optional)" class="mb-2" />
          <v-textarea id="customer-notes-input" v-model="form.notes" label="Notes (optional)" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancel</v-btn>
          <v-btn id="save-customer-btn" color="primary" :loading="saving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="!!deleteTarget" max-width="420" @update:model-value="deleteTarget = null">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">Delete customer?</v-card-title>
        <v-card-text>"{{ deleteTarget?.name }}" will be removed. Past invoices are kept.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTarget = null">Cancel</v-btn>
          <v-btn id="confirm-delete-customer-btn" color="error" :loading="deleting" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
