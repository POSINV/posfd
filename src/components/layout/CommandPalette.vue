<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

// Linear-style ⌘K / Ctrl+K launcher. Purely navigational: it jumps to any
// page (and runs a few app actions) without touching the mouse.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // [{ key, title, icon, to?, action?, group }]
  items: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const router = useRouter()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref(null)

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter((i) => i.title.toLowerCase().includes(q) || i.key.toLowerCase().includes(q))
})

const grouped = computed(() => {
  const groups = []
  results.value.forEach((item, index) => {
    let g = groups.find((x) => x.name === item.group)
    if (!g) groups.push((g = { name: item.group, items: [] }))
    g.items.push({ ...item, index })
  })
  return groups
})

watch(open, async (v) => {
  if (!v) return
  query.value = ''
  activeIndex.value = 0
  await nextTick()
  inputRef.value?.focus()
})
watch(query, () => (activeIndex.value = 0))

function run(item) {
  if (!item) return
  open.value = false
  if (item.action) item.action()
  else if (item.to) router.push(item.to)
}

function onKeydown(e) {
  const n = results.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = n ? (activeIndex.value + 1) % n : 0
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = n ? (activeIndex.value - 1 + n) % n : 0
  } else if (e.key === 'Enter') {
    e.preventDefault()
    run(results.value[activeIndex.value])
  }
}

function onGlobalKey(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <v-dialog v-model="open" max-width="600" location="top" class="cmdk-dialog" transition="fade-transition">
    <div id="command-palette" class="cmdk" @keydown="onKeydown">
      <div class="cmdk-input-row">
        <v-icon icon="mdi-magnify" size="20" class="text-medium-emphasis" />
        <input
          ref="inputRef"
          v-model="query"
          id="command-palette-input"
          class="cmdk-input"
          :placeholder="t('shell.commandPlaceholder')"
          autocomplete="off"
          spellcheck="false"
        />
        <kbd class="kbd">Esc</kbd>
      </div>

      <div class="cmdk-list">
        <div v-if="!results.length" class="cmdk-empty">{{ t('shell.noResults') }}</div>
        <template v-for="group in grouped" :key="group.name">
          <div class="cmdk-group">{{ group.name }}</div>
          <button
            v-for="item in group.items"
            :key="item.key"
            type="button"
            class="cmdk-item"
            :class="{ 'is-active': item.index === activeIndex }"
            @mousemove="activeIndex = item.index"
            @click="run(item)"
          >
            <v-icon :icon="item.icon" size="18" class="cmdk-item-icon" />
            <span class="flex-grow-1 text-left">{{ item.title }}</span>
            <v-icon v-if="item.index === activeIndex" icon="mdi-keyboard-return" size="16" class="text-medium-emphasis" />
          </button>
        </template>
      </div>

      <div class="cmdk-footer">
        <span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> {{ t('shell.navigate') }}</span>
        <span><kbd class="kbd">↵</kbd> {{ t('shell.open') }}</span>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.cmdk-dialog :deep(.v-overlay__content) {
  margin-top: 12vh !important;
}

.cmdk {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.1);
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface));
}

.cmdk-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.cmdk-input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 15px;
  color: inherit;
}

.cmdk-input:focus-visible {
  outline: none;
}

.cmdk-list {
  max-height: 380px;
  overflow-y: auto;
  padding: 6px;
}

.cmdk-group {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.45);
  padding: 10px 10px 4px;
}

.cmdk-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 8px;
  font-size: 14px;
  color: inherit;
  cursor: pointer;
}

.cmdk-item.is-active {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.cmdk-item-icon {
  opacity: 0.7;
}

.cmdk-empty {
  padding: 28px;
  text-align: center;
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.cmdk-footer {
  display: flex;
  gap: 16px;
  padding: 8px 14px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
