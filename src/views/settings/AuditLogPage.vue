<script setup>
import { ref, onMounted, watch } from 'vue'
import { AuditLogsApi } from '@/api/auditLogs'
import { apiErrorMessage } from '@/api/client'

const logs = ref([])
const page = ref(1)
const pageSize = 25
const totalCount = ref(0)
const loading = ref(true)
const errorMessage = ref('')

const actionFilter = ref(null)
const entityTypeFilter = ref(null)
const fromDate = ref('')
const toDate = ref('')

const actionOptions = [
  { title: 'Product created', value: 'product.created' },
  { title: 'Product updated', value: 'product.updated' },
  { title: 'Product price changed', value: 'product.price_changed' },
  { title: 'Product deleted', value: 'product.deleted' },
  { title: 'Business settings updated', value: 'business.settings_updated' },
  { title: 'Onboarding completed', value: 'business.onboarding_completed' },
  { title: 'Invoice created', value: 'invoice.created' },
  { title: 'Invoice cancelled', value: 'invoice.cancelled' },
  { title: 'Stock adjusted', value: 'inventory.adjusted' },
  { title: 'Bulk import performed', value: 'import.performed' },
]

const entityTypeOptions = ['Product', 'Business', 'Invoice', 'ProductVariant']

const actionLabels = Object.fromEntries(actionOptions.map((o) => [o.value, o.title]))

const actionColors = {
  'product.created': 'success',
  'product.updated': 'default',
  'product.price_changed': 'warning',
  'product.deleted': 'error',
  'business.settings_updated': 'default',
  'business.onboarding_completed': 'success',
  'invoice.created': 'success',
  'invoice.cancelled': 'error',
  'inventory.adjusted': 'warning',
  'import.performed': 'default',
}

onMounted(load)
watch([actionFilter, entityTypeFilter, fromDate, toDate], () => {
  page.value = 1
  load()
})
watch(page, load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await AuditLogsApi.list({
      page: page.value,
      page_size: pageSize,
      action: actionFilter.value,
      entity_type: entityTypeFilter.value,
      from: fromDate.value || undefined,
      to: toDate.value || undefined,
    })
    logs.value = result.data
    totalCount.value = result.pagination.total_count
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function metadataSummary(log) {
  const entries = Object.entries(log.metadata || {})
  if (!entries.length) return '—'
  return entries
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join(', ')
}

const pageCount = () => Math.max(1, Math.ceil(totalCount.value / pageSize))
</script>

<template>
  <v-container max-width="1000" class="py-8">
    <h1 class="text-h5 font-weight-bold mb-1">Audit Log</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Who did what, and when - product changes, price changes, invoices, stock adjustments,
      settings changes, and bulk imports for this business.
    </p>

    <v-card class="pa-4 mb-4" border>
      <v-row dense>
        <v-col cols="12" sm="3">
          <v-select
            v-model="actionFilter"
            :items="actionOptions"
            label="Action"
            clearable
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="3">
          <v-select
            v-model="entityTypeFilter"
            :items="entityTypeOptions"
            label="Entity type"
            clearable
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="3">
          <v-text-field v-model="fromDate" type="date" label="From" density="comfortable" />
        </v-col>
        <v-col cols="12" sm="3">
          <v-text-field v-model="toDate" type="date" label="To" density="comfortable" />
        </v-col>
      </v-row>
    </v-card>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <v-card border>
      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="!logs.length" class="pa-12 text-center">
        <v-icon icon="mdi-shield-search-outline" size="40" color="medium-emphasis" class="mb-3" />
        <div class="text-body-1 font-weight-medium">No matching entries</div>
        <div class="text-body-2 text-medium-emphasis">
          Actions like creating a product or billing an invoice will show up here.
        </div>
      </div>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>When</th>
            <th>Action</th>
            <th>Entity</th>
            <th>User</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td class="text-no-wrap">{{ new Date(log.inserted_at).toLocaleString() }}</td>
            <td>
              <v-chip size="small" :color="actionColors[log.action] || 'default'" variant="tonal">
                {{ actionLabels[log.action] || log.action }}
              </v-chip>
            </td>
            <td>{{ log.entity_type }}</td>
            <td>{{ log.user?.full_name || '—' }}</td>
            <td class="text-body-2 text-medium-emphasis">{{ metadataSummary(log) }}</td>
          </tr>
        </tbody>
      </v-table>

      <div v-if="!loading && totalCount > pageSize" class="d-flex justify-center pa-4">
        <v-pagination v-model="page" :length="pageCount()" density="comfortable" />
      </div>
    </v-card>
  </v-container>
</template>
