<script setup>
import { ref, computed } from 'vue'

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

const PRESETS = [
  { title: 'Today', range: () => ({ from: toISO(new Date()), to: toISO(new Date()) }) },
  { title: 'Yesterday', range: () => ({ from: toISO(daysAgo(1)), to: toISO(daysAgo(1)) }) },
  { title: 'Last 7 Days', range: () => ({ from: toISO(daysAgo(6)), to: toISO(new Date()) }) },
  {
    title: 'This Month',
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: toISO(start), to: toISO(now) }
    },
  },
  {
    title: 'Last Month',
    range: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: toISO(start), to: toISO(end) }
    },
  },
]

const activePreset = ref('Today')
const customOpen = ref(false)

function applyPreset(preset) {
  activePreset.value = preset.title
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
  activePreset.value = 'Custom'
  customOpen.value = true
}
</script>

<template>
  <div class="d-flex align-center flex-wrap ga-2">
    <v-btn
      v-for="preset in PRESETS"
      :key="preset.title"
      size="small"
      :variant="activePreset === preset.title ? 'flat' : 'outlined'"
      :color="activePreset === preset.title ? 'primary' : undefined"
      @click="applyPreset(preset)"
    >
      {{ preset.title }}
    </v-btn>
    <v-btn
      size="small"
      :variant="activePreset === 'Custom' ? 'flat' : 'outlined'"
      :color="activePreset === 'Custom' ? 'primary' : undefined"
      @click="openCustom"
    >
      Custom
    </v-btn>

    <template v-if="customOpen">
      <v-text-field v-model="fromModel" type="date" density="compact" hide-details style="max-width: 160px" />
      <span class="text-medium-emphasis">to</span>
      <v-text-field v-model="toModel" type="date" density="compact" hide-details style="max-width: 160px" />
    </template>
  </div>
</template>
