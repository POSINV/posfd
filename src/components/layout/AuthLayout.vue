<script setup>
import LanguageSwitcher from '@/components/shared/LanguageSwitcher.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <v-main class="auth-layout">
    <div class="auth-language-switcher">
      <LanguageSwitcher />
    </div>
    <v-container class="fill-height" max-width="480">
      <div class="w-100">
        <div class="text-center mb-8">
          <div class="d-inline-flex align-center justify-center bg-primary rounded-lg mb-4" style="width: 48px; height: 48px">
            <v-icon icon="mdi-storefront-outline" color="white" size="28" />
          </div>
          <h1 class="text-h5 font-weight-bold text-on-surface">{{ title }}</h1>
          <p v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1">{{ subtitle }}</p>
        </div>

        <v-card class="pa-6 pa-sm-8" border>
          <slot />
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>

<style scoped>
.auth-layout {
  background: rgb(var(--v-theme-background));
  min-height: 100vh;
  position: relative;
}

.auth-language-switcher {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
}
</style>
