<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { WhatsappApi } from '@/api/whatsapp'
import { apiErrorMessage } from '@/api/client'

const { t } = useI18n()
const tab = ref('templates')
const loading = ref(true)
const errorMessage = ref('')

const templates = ref([])
const campaigns = ref([])
const messages = ref([])

const purposes = computed(() => [
  { title: t('whatsapp.purposes.billing'), value: 'billing' },
  { title: t('whatsapp.purposes.payment'), value: 'payment' },
  { title: t('whatsapp.purposes.loyalty'), value: 'loyalty' },
  { title: t('whatsapp.purposes.offer'), value: 'offer' },
  { title: t('whatsapp.purposes.birthday'), value: 'birthday' },
  { title: t('whatsapp.purposes.winback'), value: 'winback' },
  { title: t('whatsapp.purposes.custom'), value: 'custom' },
])
const categories = computed(() => [
  { title: t('whatsapp.categories.utility'), value: 'utility' },
  { title: t('whatsapp.categories.marketing'), value: 'marketing' },
  { title: t('whatsapp.categories.authentication'), value: 'authentication' },
])
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
const audienceSegments = computed(() => [
  { title: t('common.segments.all'), value: 'all' },
  { title: t('common.segments.vip'), value: 'vip' },
  { title: t('common.segments.highValue'), value: 'high_value' },
  { title: t('common.segments.regular'), value: 'regular' },
  { title: t('common.segments.new'), value: 'new' },
  { title: t('common.segments.inactive'), value: 'inactive' },
])

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

const statsDialogOpen = ref(false)
const statsTarget = ref(null)
const statsLoading = ref(false)

async function viewStats(campaign) {
  statsTarget.value = { name: campaign.name, stats: null }
  statsDialogOpen.value = true
  statsLoading.value = true
  try {
    const full = await WhatsappApi.getCampaign(campaign.id)
    statsTarget.value = { name: campaign.name, stats: full.stats }
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    statsLoading.value = false
  }
}
</script>

<template>
  <v-container class="py-8">
    <h1 class="text-h5 font-weight-bold mb-1">{{ $t('nav.whatsapp') }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      {{ $t('whatsapp.subtitle') }}
    </p>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <template v-else>
      <v-tabs v-model="tab" class="mb-4">
        <v-tab value="templates">{{ $t('whatsapp.templates') }}</v-tab>
        <v-tab value="campaigns">{{ $t('whatsapp.campaigns') }}</v-tab>
        <v-tab value="history">{{ $t('whatsapp.messageHistory') }}</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="templates">
          <div class="d-flex justify-end mb-3">
            <v-btn id="new-template-btn" color="primary" prepend-icon="mdi-plus" @click="openCreateTemplate">
              {{ $t('whatsapp.newTemplate') }}
            </v-btn>
          </div>

          <v-card border>
            <div v-if="!templates.length" class="pa-12 text-center text-body-2 text-medium-emphasis">
              {{ $t('whatsapp.noTemplatesYet') }}
            </div>
            <v-list v-else lines="two">
              <v-list-item v-for="tpl in templates" :key="tpl.id" @click="openEditTemplate(tpl)">
                <v-list-item-title class="d-flex align-center ga-2">
                  {{ tpl.name }}
                  <v-chip size="x-small" variant="tonal">{{ $t(`whatsapp.purposes.${tpl.purpose}`) }}</v-chip>
                  <v-chip size="x-small" :color="statusColors[tpl.status]" variant="tonal">{{ $t(`whatsapp.templateStatus.${tpl.status}`) }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>{{ tpl.body }}</v-list-item-subtitle>
                <template v-if="tpl.status === 'rejected' && tpl.rejected_reason" #append>
                  <span class="text-caption text-error">{{ tpl.rejected_reason }}</span>
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
              {{ $t('whatsapp.newCampaign') }}
            </v-btn>
          </div>
          <p v-if="!approvedTemplates().length" class="text-caption text-medium-emphasis mb-3">
            {{ $t('whatsapp.needApprovedTemplateHint') }}
          </p>

          <v-card border>
            <div v-if="!campaigns.length" class="pa-12 text-center text-body-2 text-medium-emphasis">
              {{ $t('whatsapp.noCampaignsYet') }}
            </div>
            <v-list v-else lines="two">
              <v-list-item v-for="c in campaigns" :key="c.id">
                <v-list-item-title class="d-flex align-center ga-2">
                  {{ c.name }}
                  <v-chip size="x-small" :color="statusColors[c.status]" variant="tonal">{{ $t(`whatsapp.campaignStatus.${c.status}`) }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ $t(`common.segments.${c.audience_segment === 'high_value' ? 'highValue' : c.audience_segment}`) }} &middot; {{ c.template?.name }}
                  <span v-if="c.scheduled_at"> &middot; {{ new Date(c.scheduled_at).toLocaleString() }}</span>
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    v-if="c.status === 'sent'"
                    size="small"
                    variant="tonal"
                    class="mr-1"
                    @click="viewStats(c)"
                  >
                    {{ $t('whatsapp.stats') }}
                  </v-btn>
                  <v-btn
                    v-if="['draft', 'scheduled'].includes(c.status)"
                    size="small"
                    variant="tonal"
                    color="error"
                    @click="cancelCampaign(c)"
                  >
                    {{ $t('common.cancel') }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-window-item>

        <v-window-item value="history">
          <v-card border>
            <div v-if="!messages.length" class="pa-12 text-center text-body-2 text-medium-emphasis">
              {{ $t('whatsapp.noMessagesSentYet') }}
            </div>
            <v-list v-else lines="two">
              <v-list-item v-for="m in messages" :key="m.id">
                <v-list-item-title class="d-flex align-center ga-2">
                  {{ m.customer?.name || $t('whatsapp.unknown') }}
                  <v-chip size="x-small" variant="tonal">{{ $t(`whatsapp.kind.${m.kind}`) }}</v-chip>
                  <v-chip size="x-small" :color="statusColors[m.status]" variant="tonal">{{ $t(`whatsapp.messageStatus.${m.status}`) }}</v-chip>
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
        <v-card-title class="font-weight-bold">{{ editingTemplate ? $t('whatsapp.editTemplate') : $t('whatsapp.newTemplate') }}</v-card-title>
        <v-card-text>
          <p v-if="editingTemplate" class="text-caption text-medium-emphasis mb-3">
            {{ $t('whatsapp.editResubmitsHint') }}
          </p>
          <v-text-field id="template-name-input" v-model="templateForm.name" :label="$t('whatsapp.internalName')" class="mb-2" />
          <v-row>
            <v-col cols="12" sm="4">
              <v-select id="template-purpose-select" v-model="templateForm.purpose" :items="purposes" :label="$t('whatsapp.usedFor')" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select id="template-category-select" v-model="templateForm.category" :items="categories" :label="$t('whatsapp.metaCategory')" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select id="template-language-select" v-model="templateForm.language" :items="languages" :label="$t('onboarding.language')" />
            </v-col>
          </v-row>
          <v-textarea
            id="template-body-input"
            v-model="templateForm.body"
            :label="$t('whatsapp.messageBody')"
            :hint="'{{1}}, {{2}}, ... ' + $t('whatsapp.messageBodyHint')"
            persistent-hint
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="templateDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn id="save-template-btn" color="primary" :loading="templateSaving" @click="saveTemplate">{{ $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="campaignDialogOpen" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('whatsapp.newCampaign') }}</v-card-title>
        <v-card-text>
          <v-text-field id="campaign-name-input" v-model="campaignForm.name" :label="$t('whatsapp.campaignName')" class="mb-2" />
          <v-select
            id="campaign-template-select"
            v-model="campaignForm.template_id"
            :items="approvedTemplates().map((tpl) => ({ title: tpl.name, value: tpl.id }))"
            :label="$t('whatsapp.template')"
            class="mb-2"
          />
          <v-select
            id="campaign-audience-select"
            v-model="campaignForm.audience_segment"
            :items="audienceSegments"
            :label="$t('whatsapp.audience')"
            class="mb-2"
          />
          <v-text-field
            id="campaign-schedule-input"
            v-model="campaignForm.scheduled_at"
            :label="$t('whatsapp.scheduleForLater')"
            type="datetime-local"
            :hint="$t('whatsapp.scheduleHint')"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="campaignDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            id="save-campaign-btn"
            color="primary"
            :loading="campaignSaving"
            :disabled="!campaignForm.name || !campaignForm.template_id"
            @click="saveCampaign"
          >
            {{ campaignForm.scheduled_at ? $t('whatsapp.schedule') : $t('whatsapp.sendNow') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="statsDialogOpen" max-width="360">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ statsTarget?.name }}</v-card-title>
        <v-card-text>
          <div v-if="statsLoading" class="d-flex justify-center py-6">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <template v-else-if="statsTarget?.stats">
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>{{ $t('whatsapp.messageStatus.queued') }}</span><span>{{ statsTarget.stats.queued }}</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>{{ $t('whatsapp.messageStatus.sent') }}</span><span>{{ statsTarget.stats.sent }}</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>{{ $t('whatsapp.messageStatus.delivered') }}</span><span>{{ statsTarget.stats.delivered }}</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span>{{ $t('whatsapp.messageStatus.read') }}</span><span>{{ statsTarget.stats.read }}</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1 text-error">
              <span>{{ $t('whatsapp.messageStatus.failed') }}</span><span>{{ statsTarget.stats.failed }}</span>
            </div>
            <v-divider class="my-2" />
            <div class="d-flex justify-space-between text-body-2 font-weight-bold">
              <span>{{ $t('whatsapp.total') }}</span><span>{{ statsTarget.stats.total }}</span>
            </div>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="statsDialogOpen = false">{{ $t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
