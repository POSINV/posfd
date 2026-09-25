<script setup>
import { ref, onMounted } from 'vue'
import { WhatsappApi } from '@/api/whatsapp'
import { apiErrorMessage } from '@/api/client'

const tab = ref('templates')
const loading = ref(true)
const errorMessage = ref('')

const templates = ref([])
const campaigns = ref([])
const messages = ref([])

const purposes = [
  { title: 'Bill ready', value: 'billing' },
  { title: 'Payment received', value: 'payment' },
  { title: 'Loyalty points', value: 'loyalty' },
  { title: 'Offer / promotion', value: 'offer' },
  { title: 'Other', value: 'custom' },
]
const categories = [
  { title: 'Utility', value: 'utility' },
  { title: 'Marketing', value: 'marketing' },
  { title: 'Authentication', value: 'authentication' },
]
const languages = [
  { title: 'English', value: 'en' },
  { title: 'Hindi', value: 'hi' },
  { title: 'Tamil', value: 'ta' },
  { title: 'Telugu', value: 'te' },
  { title: 'Malayalam', value: 'ml' },
  { title: 'Marathi', value: 'mr' },
  { title: 'Gujarati', value: 'gu' },
  { title: 'Bengali', value: 'bn' },
  { title: 'Kannada', value: 'kn' },
]
const audienceSegments = [
  { title: 'All customers', value: 'all' },
  { title: 'VIP', value: 'vip' },
  { title: 'High value', value: 'high_value' },
  { title: 'Regular', value: 'regular' },
  { title: 'New', value: 'new' },
  { title: 'Inactive', value: 'inactive' },
]

const statusColors = {
  draft: 'default',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'error',
  scheduled: 'info',
  sent: 'success',
  cancelled: 'default',
  queued: 'info',
  delivered: 'success',
  read: 'success',
  failed: 'error',
}

const templateDialogOpen = ref(false)
const editingTemplate = ref(null)
const templateForm = ref(emptyTemplateForm())
const templateSaving = ref(false)

const campaignDialogOpen = ref(false)
const campaignForm = ref(emptyCampaignForm())
const campaignSaving = ref(false)

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [templatesData, campaignsData, messagesData] = await Promise.all([
      WhatsappApi.listTemplates(),
      WhatsappApi.listCampaigns(),
      WhatsappApi.listMessages({ page_size: 25 }),
    ])
    templates.value = templatesData
    campaigns.value = campaignsData
    messages.value = messagesData.data
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function emptyTemplateForm() {
  return { name: '', purpose: 'custom', category: 'utility', language: 'en', body: '' }
}

function openCreateTemplate() {
  editingTemplate.value = null
  templateForm.value = emptyTemplateForm()
  templateDialogOpen.value = true
}

function openEditTemplate(template) {
  editingTemplate.value = template
  templateForm.value = {
    name: template.name,
    purpose: template.purpose,
    category: template.category,
    language: template.language,
    body: template.body,
  }
  templateDialogOpen.value = true
}

async function saveTemplate() {
  templateSaving.value = true
  errorMessage.value = ''
  try {
    if (editingTemplate.value) {
      await WhatsappApi.updateTemplate(editingTemplate.value.id, templateForm.value)
    } else {
      await WhatsappApi.createTemplate(templateForm.value)
    }
    templateDialogOpen.value = false
    await loadAll()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    templateSaving.value = false
  }
}

const approvedTemplates = () => templates.value.filter((t) => t.status === 'approved')

function emptyCampaignForm() {
  return { name: '', template_id: null, audience_segment: 'all', scheduled_at: '' }
}

function openCreateCampaign() {
  campaignForm.value = emptyCampaignForm()
  campaignDialogOpen.value = true
}

async function saveCampaign() {
  campaignSaving.value = true
  errorMessage.value = ''
  try {
    const payload = { ...campaignForm.value }
    if (payload.scheduled_at) payload.scheduled_at = new Date(payload.scheduled_at).toISOString()
    else delete payload.scheduled_at

    await WhatsappApi.createCampaign(payload)
    campaignDialogOpen.value = false
    await loadAll()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    campaignSaving.value = false
  }
}

async function cancelCampaign(campaign) {
  errorMessage.value = ''
  try {
    await WhatsappApi.cancelCampaign(campaign.id)
    await loadAll()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
}
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h5 font-weight-bold mb-1">WhatsApp</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Official WhatsApp Business templates, campaigns, and delivery history.
    </p>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <v-tabs v-model="tab" class="mb-4">
        <v-tab value="templates">Templates</v-tab>
        <v-tab value="campaigns">Campaigns</v-tab>
        <v-tab value="history">Message History</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="templates">
          <div class="d-flex justify-end mb-3">
            <v-btn id="new-template-btn" color="primary" prepend-icon="mdi-plus" @click="openCreateTemplate">
              New Template
            </v-btn>
          </div>

          <v-card border>
            <div v-if="!templates.length" class="pa-12 text-center text-body-2 text-medium-emphasis">
              No templates yet. Create one, then wait for platform review before it can be used.
            </div>
            <v-list v-else lines="two">
              <v-list-item v-for="t in templates" :key="t.id" @click="openEditTemplate(t)">
                <v-list-item-title class="d-flex align-center ga-2">
                  {{ t.name }}
                  <v-chip size="x-small" variant="tonal">{{ t.purpose }}</v-chip>
                  <v-chip size="x-small" :color="statusColors[t.status]" variant="tonal">{{ t.status.replaceAll('_', ' ') }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>{{ t.body }}</v-list-item-subtitle>
                <template v-if="t.status === 'rejected' && t.rejected_reason" #append>
                  <span class="text-caption text-error">{{ t.rejected_reason }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-window-item>

        <v-window-item value="campaigns">
          <div class="d-flex justify-end mb-3">
            <v-btn
              id="new-campaign-btn"
              color="primary"
              prepend-icon="mdi-plus"
              :disabled="!approvedTemplates().length"
              @click="openCreateCampaign"
            >
              New Campaign
            </v-btn>
          </div>
          <p v-if="!approvedTemplates().length" class="text-caption text-medium-emphasis mb-3">
            You need at least one approved template before you can create a campaign.
          </p>

          <v-card border>
            <div v-if="!campaigns.length" class="pa-12 text-center text-body-2 text-medium-emphasis">
              No campaigns yet.
            </div>
            <v-list v-else lines="two">
              <v-list-item v-for="c in campaigns" :key="c.id">
                <v-list-item-title class="d-flex align-center ga-2">
                  {{ c.name }}
                  <v-chip size="x-small" :color="statusColors[c.status]" variant="tonal">{{ c.status }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ c.audience_segment }} &middot; {{ c.template?.name }}
                  <span v-if="c.scheduled_at"> &middot; {{ new Date(c.scheduled_at).toLocaleString() }}</span>
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    v-if="['draft', 'scheduled'].includes(c.status)"
                    size="small"
                    variant="tonal"
                    color="error"
                    @click="cancelCampaign(c)"
                  >
                    Cancel
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-window-item>

        <v-window-item value="history">
          <v-card border>
            <div v-if="!messages.length" class="pa-12 text-center text-body-2 text-medium-emphasis">
              No messages sent yet.
            </div>
            <v-list v-else lines="two">
              <v-list-item v-for="m in messages" :key="m.id">
                <v-list-item-title class="d-flex align-center ga-2">
                  {{ m.customer?.name || 'Unknown' }}
                  <v-chip size="x-small" variant="tonal">{{ m.kind }}</v-chip>
                  <v-chip size="x-small" :color="statusColors[m.status]" variant="tonal">{{ m.status }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>{{ m.body }}</v-list-item-subtitle>
                <template #append>
                  <span class="text-caption text-medium-emphasis">{{ new Date(m.inserted_at).toLocaleString() }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-window-item>
      </v-window>
    </template>

    <v-dialog v-model="templateDialogOpen" max-width="560">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ editingTemplate ? 'Edit Template' : 'New Template' }}</v-card-title>
        <v-card-text>
          <p v-if="editingTemplate" class="text-caption text-medium-emphasis mb-3">
            Editing content resubmits this template for platform review.
          </p>
          <v-text-field id="template-name-input" v-model="templateForm.name" label="Internal name" class="mb-2" />
          <v-row>
            <v-col cols="12" sm="4">
              <v-select id="template-purpose-select" v-model="templateForm.purpose" :items="purposes" label="Used for" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select id="template-category-select" v-model="templateForm.category" :items="categories" label="Meta category" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select id="template-language-select" v-model="templateForm.language" :items="languages" label="Language" />
            </v-col>
          </v-row>
          <v-textarea
            id="template-body-input"
            v-model="templateForm.body"
            label="Message body"
            hint="Use {{1}}, {{2}}, ... for variables (e.g. customer name, bill number)"
            persistent-hint
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="templateDialogOpen = false">Cancel</v-btn>
          <v-btn id="save-template-btn" color="primary" :loading="templateSaving" @click="saveTemplate">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="campaignDialogOpen" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">New Campaign</v-card-title>
        <v-card-text>
          <v-text-field id="campaign-name-input" v-model="campaignForm.name" label="Campaign name" class="mb-2" />
          <v-select
            id="campaign-template-select"
            v-model="campaignForm.template_id"
            :items="approvedTemplates().map((t) => ({ title: t.name, value: t.id }))"
            label="Template"
            class="mb-2"
          />
          <v-select
            id="campaign-audience-select"
            v-model="campaignForm.audience_segment"
            :items="audienceSegments"
            label="Audience"
            class="mb-2"
          />
          <v-text-field
            id="campaign-schedule-input"
            v-model="campaignForm.scheduled_at"
            label="Schedule for later (optional)"
            type="datetime-local"
            hint="Leave blank to send now"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="campaignDialogOpen = false">Cancel</v-btn>
          <v-btn
            id="save-campaign-btn"
            color="primary"
            :loading="campaignSaving"
            :disabled="!campaignForm.name || !campaignForm.template_id"
            @click="saveCampaign"
          >
            {{ campaignForm.scheduled_at ? 'Schedule' : 'Send Now' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
