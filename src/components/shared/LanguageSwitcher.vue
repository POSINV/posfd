<script setup>
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '@/plugins/i18n'

defineProps({
  // Icon-only, for tight spaces like the mobile app bar.
  compact: { type: Boolean, default: false },
})

const { locale } = useI18n()

function currentLabel() {
  return SUPPORTED_LOCALES.find((l) => l.code === locale.value)?.label || 'English'
}
</script>

<template>
  <v-menu>
    <template #activator="{ props: activatorProps }">
      <v-btn
        id="language-switcher-activator"
        v-bind="activatorProps"
        variant="text"
        size="small"
        :icon="compact"
        :prepend-icon="compact ? undefined : 'mdi-translate'"
      >
        <v-icon v-if="compact" icon="mdi-translate" />
        <template v-else>{{ currentLabel() }}</template>
      </v-btn>
    </template>
    <v-list density="comfortable" min-width="160">
      <v-list-item
        v-for="item in SUPPORTED_LOCALES"
        :key="item.code"
        :active="item.code === locale"
        @click="setLocale(item.code)"
      >
        <v-list-item-title>{{ item.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
