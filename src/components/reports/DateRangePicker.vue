<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Object, required: true }, // { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
})
const emit = defineEmits(['update:modelValue'])

function toISO(date) {
  return date.toISOString().slice(0, 10)
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const PRESETS = computed(() => [
  { key: 'today', title: t('reports.presets.today'), range: () => ({ from: toISO(new Date()), to: toISO(new Date()) }) },
  { key: 'yesterday', title: t('reports.presets.yesterday'), range: () => ({ from: toISO(daysAgo(1)), to: toISO(daysAgo(1)) }) },
  { key: 'last7days', title: t('reports.presets.last7Days'), range: () => ({ from: toISO(daysAgo(6)), to: toISO(new Date()) }) },
  {
    key: 'thisMonth',
    title: t('reports.presets.thisMonth'),
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: toISO(start), to: toISO(now) }
    },
  },
  {
    key: 'lastMonth',
    title: t('reports.presets.lastMonth'),
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: toISO(start), to: toISO(end) }
    },
  },
])

const activePreset = ref('today')
const customOpen = ref(false)

function applyPreset(preset) {
  activePreset.value = preset.key
  customOpen.value = false
  emit('update:modelValue', preset.range())
}

const fromModel = computed({
  get: () => props.modelValue.from,
  set: (v) => emit('update:modelValue', { ...props.modelValue, from: v }),
})
const toModel = computed({
  get: () => props.modelValue.to,
  set: (v) => emit('update:modelValue', { ...props.modelValue, to: v }),
})

function openCustom() {
  activePreset.value = 'custom'
  customOpen.value = true
}
</script>

<template>
  <div class="d-flex align-center flex-wrap ga-2">
    <v-btn
      v-for="preset in PRESETS"
      :key="preset.key"
      size="small"
      :variant="activePreset === preset.key ? 'flat' : 'outlined'"
      :color="activePreset === preset.key ? 'primary' : undefined"
      @click="applyPreset(preset)"
    >
      {{ preset.title }}
    </v-btn>
    <v-btn
      size="small"
      :variant="activePreset === 'custom' ? 'flat' : 'outlined'"
      :color="activePreset === 'custom' ? 'primary' : undefined"
      @click="openCustom"
    >
      {{ $t('reports.presets.custom') }}
    </v-btn>

    <template v-if="customOpen">
      <v-text-field v-model="fromModel" type="date" density="compact" hide-details style="max-width: 160px" />
      <span class="text-medium-emphasis">{{ $t('reports.to') }}</span>
      <v-text-field v-model="toModel" type="date" density="compact" hide-details style="max-width: 160px" />
    </template>
  </div>
</template>
