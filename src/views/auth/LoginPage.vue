<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { apiErrorMessage } from '@/api/client'
import AuthLayout from '@/components/layout/AuthLayout.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const formRef = ref(null)

const rules = {
  required: (v) => !!v || 'Required',
}

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = ''

  try {
    await auth.login({ email: email.value, password: password.value })
    router.push(route.query.redirect || { name: 'dashboard' })
  } catch (error) {
    errorMessage.value =
      error?.response?.status === 401
        ? t('auth.invalidCredentials')
        : apiErrorMessage(error, t('common.somethingWentWrong'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout :title="t('auth.loginTitle')" :subtitle="t('auth.loginSubtitle')">
    <v-form ref="formRef" @submit.prevent="submit">
      <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4" id="login-error">
        {{ errorMessage }}
      </v-alert>

      <v-text-field
        id="login-email"
        v-model="email"
        :label="t('auth.email')"
        type="email"
        autocomplete="email"
        :rules="[rules.required]"
        class="mb-2"
      />
      <v-text-field
        id="login-password"
        v-model="password"
        :label="t('auth.password')"
        type="password"
        autocomplete="current-password"
        :rules="[rules.required]"
        class="mb-2"
      />

      <v-btn id="login-submit" type="submit" color="primary" size="large" block :loading="loading">
        {{ t('auth.login') }}
      </v-btn>
    </v-form>

    <div class="text-center text-body-2 mt-6">
      {{ t('auth.noAccount') }}
      <RouterLink id="login-register-link" to="/register" class="text-primary font-weight-medium">
        {{ t('auth.register') }}
      </RouterLink>
    </div>
  </AuthLayout>
</template>
