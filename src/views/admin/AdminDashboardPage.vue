<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { AdminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'

const router = useRouter()
const admin = useAdminStore()

const loading = ref(true)
const errorMessage = ref('')
const counts = ref({})
const businesses = ref([])
const statusFilter = ref(null)
const plans = ref([])

const activateDialogOpen = ref(false)
const activateTarget = ref(null)
const activateForm = ref({ plan_id: null, payment_provider: 'manual', provider_reference: '', notes: '' })
const activating = ref(false)

const pendingTemplates = ref([])
const reviewingId = ref(null)

const summaryCards = [
  { key: 'trialing', title: 'On Trial', color: 'info' },
  { key: 'trial_ending_soon', title: 'Trial Ending Soon', color: 'warning' },
  { key: 'active', title: 'Active', color: 'success' },
  { key: 'renewal_due', title: 'Renewal Due', color: 'warning' },
  { key: 'suspended', title: 'Suspended', color: 'error' },
  { key: 'cancelled', title: 'Cancelled', color: 'default' },
]

const statusColors = {
  trialing: 'info',
  trial_ending_soon: 'warning',
  trial_expired: 'error',
  subscription_required: 'error',
  active: 'success',
  renewal_due: 'warning',
  past_due: 'warning',
  grace_period: 'warning',
  suspended: 'error',
  cancelled: 'default',
}

onMounted(load)
watch(statusFilter, loadBusinesses)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [countsData, businessesData, plansData, templatesData] = await Promise.all([
      AdminApi.dashboard(),
      AdminApi.businesses(statusFilter.value),
      AdminApi.plans(),
      AdminApi.whatsappTemplates(),
    ])
    counts.value = countsData
    businesses.value = businessesData
    plans.value = plansData
    pendingTemplates.value = templatesData
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function loadBusinesses() {
  try {
    businesses.value = await AdminApi.businesses(statusFilter.value)
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
}

function openActivateDialog(row) {
  activateTarget.value = row
  activateForm.value = { plan_id: row.plan?.id || null, payment_provider: 'manual', provider_reference: '', notes: '' }
  activateDialogOpen.value = true
}

async function submitActivate() {
  activating.value = true
  errorMessage.value = ''
  try {
    await AdminApi.activatePlan(activateTarget.value.business_id, activateForm.value)
    activateDialogOpen.value = false
    await load()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    activating.value = false
  }
}

async function cancelSubscription(row) {
  if (!confirm(`Cancel the subscription for ${row.business_name}?`)) return
  errorMessage.value = ''
  try {
    await AdminApi.cancelSubscription(row.business_id)
    await load()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
}

async function approveTemplate(template) {
  const providerTemplateName = prompt(
    `Provider template name for "${template.name}" (the exact name registered with Meta):`,
    template.name,
  )
  if (!providerTemplateName) return

  reviewingId.value = template.id
  errorMessage.value = ''
  try {
    await AdminApi.approveWhatsappTemplate(template.id, providerTemplateName)
    pendingTemplates.value = pendingTemplates.value.filter((t) => t.id !== template.id)
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    reviewingId.value = null
  }
}

async function rejectTemplate(template) {
  const reason = prompt(`Reason for rejecting "${template.name}":`)
  if (!reason) return

  reviewingId.value = template.id
  errorMessage.value = ''
  try {
    await AdminApi.rejectWhatsappTemplate(template.id, reason)
    pendingTemplates.value = pendingTemplates.value.filter((t) => t.id !== template.id)
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    reviewingId.value = null
  }
}

async function logout() {
  await admin.logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <div>
    <v-app-bar flat border color="surface">
      <v-app-bar-title class="d-flex align-center">
        <v-avatar color="primary" size="32" rounded="lg" class="mr-3">
          <v-icon icon="mdi-shield-crown-outline" color="white" size="20" />
        </v-avatar>
        <span class="font-weight-bold">Platform Admin</span>
      </v-app-bar-title>
      <v-spacer />
      <span class="text-body-2 text-medium-emphasis mr-3">{{ admin.admin?.full_name }} ({{ admin.admin?.role }})</span>
      <v-btn id="admin-logout-btn" variant="text" @click="logout">Log out</v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid class="py-6">
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

        <div v-if="loading" class="d-flex justify-center py-12">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else>
          <v-row class="mb-4">
            <v-col v-for="card in summaryCards" :key="card.key" cols="6" sm="4" md="2">
              <v-card class="pa-4" border>
                <div class="text-caption text-medium-emphasis">{{ card.title }}</div>
                <div class="text-h5 font-weight-bold" :class="`text-${card.color}`">
                  {{ counts[card.key] || 0 }}
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-card border>
            <div class="pa-4 d-flex align-center justify-space-between flex-wrap ga-2">
              <div class="text-subtitle-1 font-weight-bold">Businesses</div>
              <v-select
                v-model="statusFilter"
                :items="[
                  { title: 'All statuses', value: null },
                  ...Object.keys(statusColors).map((s) => ({ title: s.replaceAll('_', ' '), value: s })),
                ]"
                density="compact"
                style="max-width: 220px"
                hide-details
              />
            </div>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Deadline</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in businesses" :key="row.business_id">
                  <td class="font-weight-medium">{{ row.business_name }}</td>
                  <td>{{ row.business_type }}</td>
                  <td>
                    <v-chip size="small" :color="statusColors[row.status] || 'default'" variant="tonal">
                      {{ row.status.replaceAll('_', ' ') }}
                    </v-chip>
                  </td>
                  <td>{{ row.plan?.name || '—' }}</td>
                  <td>
                    {{ new Date(row.current_period_end || row.trial_ends_at).toLocaleDateString() }}
                  </td>
                  <td>
                    <v-btn size="small" variant="tonal" color="primary" class="mr-1" @click="openActivateDialog(row)">
                      Activate Plan
                    </v-btn>
                    <v-btn
                      v-if="row.status !== 'cancelled'"
                      size="small"
                      variant="tonal"
                      color="error"
                      @click="cancelSubscription(row)"
                    >
                      Cancel
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>

          <v-card border class="mt-6">
            <div class="pa-4 text-subtitle-1 font-weight-bold">WhatsApp Templates Pending Review</div>
            <div v-if="!pendingTemplates.length" class="pa-8 text-center text-body-2 text-medium-emphasis">
              Nothing waiting on review.
            </div>
            <v-list v-else lines="three">
              <v-list-item v-for="t in pendingTemplates" :key="t.id">
                <v-list-item-title>{{ t.business.name }} &middot; {{ t.name }} ({{ t.language }}/{{ t.category }})</v-list-item-title>
                <v-list-item-subtitle>{{ t.body }}</v-list-item-subtitle>
                <template #append>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="success"
                    class="mr-1"
                    :loading="reviewingId === t.id"
                    @click="approveTemplate(t)"
                  >
                    Approve
                  </v-btn>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="error"
                    :loading="reviewingId === t.id"
                    @click="rejectTemplate(t)"
                  >
                    Reject
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </template>
      </v-container>
    </v-main>

    <v-dialog v-model="activateDialogOpen" max-width="440">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">
          Activate plan - {{ activateTarget?.business_name }}
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="activateForm.plan_id"
            :items="plans.map((p) => ({ title: `${p.name} (${p.currency} ${p.price}/${p.billing_period})`, value: p.id }))"
            label="Plan"
            class="mb-2"
          />
          <v-text-field v-model="activateForm.payment_provider" label="Payment provider" class="mb-2" />
          <v-text-field v-model="activateForm.provider_reference" label="Payment reference" class="mb-2" />
          <v-textarea v-model="activateForm.notes" label="Notes" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="activateDialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="activating" :disabled="!activateForm.plan_id" @click="submitActivate">
            Activate
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
