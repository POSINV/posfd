<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AuditLogsApi } from '@/api/auditLogs'
import { apiErrorMessage } from '@/api/client'

const { t } = useI18n()

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

const actionOptions = computed(() => [
  { title: t('auditLog.actions.productCreated'), value: 'product.created' },
  { title: t('auditLog.actions.productUpdated'), value: 'product.updated' },
  { title: t('auditLog.actions.productPriceChanged'), value: 'product.price_changed' },
  { title: t('auditLog.actions.productDeleted'), value: 'product.deleted' },
  { title: t('auditLog.actions.businessSettingsUpdated'), value: 'business.settings_updated' },
  { title: t('auditLog.actions.onboardingCompleted'), value: 'business.onboarding_completed' },
  { title: t('auditLog.actions.invoiceCreated'), value: 'invoice.created' },
  { title: t('auditLog.actions.invoiceCancelled'), value: 'invoice.cancelled' },
  { title: t('auditLog.actions.stockAdjusted'), value: 'inventory.adjusted' },
  { title: t('auditLog.actions.bulkImportPerformed'), value: 'import.performed' },
])

const entityTypeOptions = ['Product', 'Business', 'Invoice', 'ProductVariant']

const actionLabels = computed(() => Object.fromEntries(actionOptions.value.map((o) => [o.value, o.title])))

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
    <h1 class="text-h5 font-weight-bold mb-1">{{ $t('auditLog.title') }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      {{ $t('auditLog.subtitle') }}
    </p>

    <v-card class="pa-4 mb-4" border>
      <v-row dense>
        <v-col cols="12" sm="3">
          <v-select
            v-model="actionFilter"
            :items="actionOptions"
            :label="$t('auditLog.action')"
            clearable
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="3">
          <v-select
            v-model="entityTypeFilter"
            :items="entityTypeOptions"
            :label="$t('auditLog.entityType')"
            clearable
            density="comfortable"
          />
        </v-col>
        <v-col cols="12" sm="3">
          <v-text-field v-model="fromDate" type="date" :label="$t('auditLog.from')" density="comfortable" />
        </v-col>
        <v-col cols="12" sm="3">
          <v-text-field v-model="toDate" type="date" :label="$t('auditLog.toDate')" density="comfortable" />
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
        <div class="text-body-1 font-weight-medium">{{ $t('auditLog.noMatchingEntries') }}</div>
        <div class="text-body-2 text-medium-emphasis">
          {{ $t('auditLog.emptyHint') }}
        </div>
      </div>

      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>{{ $t('auditLog.when') }}</th>
            <th>{{ $t('auditLog.action') }}</th>
            <th>{{ $t('auditLog.entity') }}</th>
            <th>{{ $t('auditLog.user') }}</th>
            <th>{{ $t('auditLog.details') }}</th>
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
