<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import client, { apiErrorMessage } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const step = ref(1)
const templates = ref([])
const templatesLoading = ref(true)
const selectedType = ref(null)

const name = ref('')
const country = ref('IN')
const currency = ref('INR')
const timezone = ref('Asia/Kolkata')
const language = ref('en')
const submitting = ref(false)
const errorMessage = ref('')

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED']
const timezones = ['Asia/Kolkata', 'Asia/Dubai', 'America/New_York', 'Europe/London', 'UTC']
const languages = [
  { title: 'English', value: 'en' },
  { title: 'Hindi', value: 'hi' },
  { title: 'Tamil', value: 'ta' },
  { title: 'Telugu', value: 'te' },
  { title: 'Malayalam', value: 'ml' },
  { title: 'Kannada', value: 'kn' },
]

onMounted(async () => {
  try {
    const { data } = await client.get('/business_types')
    templates.value = data.data
  } finally {
    templatesLoading.value = false
  }
})

function chooseType(key) {
  selectedType.value = key
  step.value = 2
}

async function finish() {
  submitting.value = true
  errorMessage.value = ''

  try {
    const business = await auth.createBusiness({
      name: name.value,
      business_type: selectedType.value,
      country: country.value,
      currency: currency.value,
      timezone: timezone.value,
      language: language.value,
    })
    await auth.completeOnboarding(business.id)
    router.push({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, t('common.somethingWentWrong'))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-main class="onboarding-page">
    <v-container max-width="720" class="py-10">
      <h1 class="text-h5 font-weight-bold mb-1">{{ t('onboarding.title') }}</h1>

      <v-card class="mt-6 pa-6" border>
        <template v-if="step === 1">
          <h2 class="text-h6 font-weight-bold">{{ t('onboarding.step1Title') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ t('onboarding.step1Subtitle') }}</p>

          <v-row v-if="!templatesLoading" id="business-type-grid">
            <v-col v-for="template in templates" :key="template.key" cols="12" sm="6">
              <v-card
                :id="`business-type-${template.key}`"
                variant="outlined"
                class="pa-4 cursor-pointer h-100"
                :class="{ 'border-primary bg-primary-lighten-5': selectedType === template.key }"
                @click="chooseType(template.key)"
              >
                <div class="font-weight-medium">{{ template.label }}</div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ template.default_categories.slice(0, 3).join(', ') }}
                </div>
              </v-card>
            </v-col>
          </v-row>
          <div v-else class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="primary" />
          </div>
        </template>

        <template v-else>
          <h2 class="text-h6 font-weight-bold">{{ t('onboarding.step2Title') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ t('onboarding.step2Subtitle') }}</p>

          <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <v-form @submit.prevent="finish">
            <v-text-field id="onboarding-name" v-model="name" :label="t('onboarding.businessName')" class="mb-2" />

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field id="onboarding-country" v-model="country" :label="t('onboarding.country')" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select id="onboarding-currency" v-model="currency" :items="currencies" :label="t('onboarding.currency')" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select id="onboarding-timezone" v-model="timezone" :items="timezones" :label="t('onboarding.timezone')" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select id="onboarding-language" v-model="language" :items="languages" :label="t('onboarding.language')" />
              </v-col>
            </v-row>

            <div class="d-flex justify-space-between mt-4">
              <v-btn id="onboarding-back" variant="text" @click="step = 1">{{ t('onboarding.back') }}</v-btn>
              <v-btn id="onboarding-finish" type="submit" color="primary" :loading="submitting" :disabled="!name">
                {{ t('onboarding.finish') }}
              </v-btn>
            </div>
          </v-form>
        </template>
      </v-card>
    </v-container>
  </v-main>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
