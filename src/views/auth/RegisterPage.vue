<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { apiErrorMessage } from '@/api/client'
import AuthLayout from '@/components/layout/AuthLayout.vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const formRef = ref(null)

const rules = {
  required: (v) => !!v || 'Required',
  minLength: (v) => (v && v.length >= 8) || 'Must be at least 8 characters',
}

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = ''

  try {
    await auth.register({ email: email.value, password: password.value, fullName: fullName.value })
    router.push({ name: 'onboarding' })
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, t('common.somethingWentWrong'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout :title="t('auth.registerTitle')" :subtitle="t('auth.registerSubtitle')">
    <v-form ref="formRef" @submit.prevent="submit">
      <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4" id="register-error">
        {{ errorMessage }}
      </v-alert>

      <v-text-field
        id="register-full-name"
        v-model="fullName"
        :label="t('auth.fullName')"
        autocomplete="name"
        :rules="[rules.required]"
        class="mb-2"
      />
      <v-text-field
        id="register-email"
        v-model="email"
        :label="t('auth.email')"
        type="email"
        autocomplete="email"
        :rules="[rules.required]"
        class="mb-2"
      />
      <v-text-field
        id="register-password"
        v-model="password"
        :label="t('auth.password')"
        type="password"
        autocomplete="new-password"
        :rules="[rules.required, rules.minLength]"
        class="mb-2"
      />

      <v-btn id="register-submit" type="submit" color="primary" size="large" block :loading="loading">
        {{ t('auth.register') }}
      </v-btn>
    </v-form>

    <div class="text-center text-body-2 mt-6">
      {{ t('auth.haveAccount') }}
      <RouterLink id="register-login-link" to="/login" class="text-primary font-weight-medium">
        {{ t('auth.login') }}
      </RouterLink>
    </div>
  </AuthLayout>
</template>
