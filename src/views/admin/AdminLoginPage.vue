<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { apiErrorMessage } from '@/api/client'
import AuthLayout from '@/components/layout/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const admin = useAdminStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function submit() {
  loading.value = true
  errorMessage.value = ''
  try {
    await admin.login(email.value, password.value)
    router.push(route.query.redirect || { name: 'admin-dashboard' })
  } catch (error) {
    errorMessage.value =
      error?.response?.status === 401 ? 'Invalid email or password' : apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout title="Platform Admin" subtitle="Internal access only - not for business owners">
    <v-form @submit.prevent="submit">
      <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4" id="admin-login-error">
        {{ errorMessage }}
      </v-alert>

      <v-text-field id="admin-login-email" v-model="email" label="Email" type="email" autocomplete="username" class="mb-2" />
      <v-text-field
        id="admin-login-password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="current-password"
        class="mb-2"
      />

      <v-btn id="admin-login-submit" type="submit" color="primary" size="large" block :loading="loading">
        Log in
      </v-btn>
    </v-form>
  </AuthLayout>
</template>
