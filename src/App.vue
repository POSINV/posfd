<script setup>
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'

const route = useRoute()
</script>

<template>
  <!-- Printed invoices always render light, whatever the UI theme. -->
  <v-app :theme="route.name === 'invoice-print' ? 'lightTheme' : undefined">
    <AppShell v-if="route.meta.layout === 'app'">
      <RouterView v-slot="{ Component, route: r }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="r.path" />
        </Transition>
      </RouterView>
    </AppShell>

    <RouterView v-else v-slot="{ Component, route: r }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="r.path" />
      </Transition>
    </RouterView>
  </v-app>
</template>
