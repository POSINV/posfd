<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { InventoryApi } from '@/api/inventory'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({
  productId: { type: String, default: null },
  variantId: { type: String, default: null },
  stockQuantity: { type: Number, default: 0 },
})
const emit = defineEmits(['stock-changed'])
const { t } = useI18n()

const target = computed(() =>
  props.variantId ? { variant_id: props.variantId } : { product_id: props.productId },
)

const movements = ref([])
const loading = ref(true)
const errorMessage = ref('')

const dialogOpen = ref(false)
const saving = ref(false)
const formErrors = ref({})

const MOVEMENT_TYPES = computed(() => [
  { title: t('stockMovements.types.openingStock'), value: 'opening_stock', direction: 'in' },
  { title: t('stockMovements.types.purchaseIn'), value: 'purchase', direction: 'in' },
  { title: t('stockMovements.types.saleOut'), value: 'sale', direction: 'out' },
  { title: t('stockMovements.types.returnIn'), value: 'return', direction: 'in' },
  { title: t('stockMovements.types.adjustmentIncrease'), value: 'adjustment', direction: 'in' },
  { title: t('stockMovements.types.adjustmentDecrease'), value: 'adjustment', direction: 'out' },
])

function emptyForm() {
  return { choice: 'opening_stock:in', quantity: 1, reference: '', notes: '' }
}
const form = ref(emptyForm())

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await InventoryApi.listMovements(target.value, { page_size: 20 })
    movements.value = result.data
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function openRecord() {
  form.value = emptyForm()
  formErrors.value = {}
  dialogOpen.value = true
}

async function save() {
  saving.value = true
  formErrors.value = {}

  const [movement_type, direction] = form.value.choice.split(':')

  try {
    await InventoryApi.recordMovement(target.value, {
      movement_type,
      direction,
      quantity: form.value.quantity,
      reference: form.value.reference || null,
      notes: form.value.notes || null,
    })
    dialogOpen.value = false
    await load()
    emit('stock-changed')
  } catch (error) {
    formErrors.value = error?.response?.data?.errors || {}
  } finally {
    saving.value = false
  }
}

function typeLabel(m) {
  const match = MOVEMENT_TYPES.value.find((item) => item.value === m.movement_type && item.direction === m.direction)
  return match?.title || m.movement_type
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <div class="text-subtitle-2 font-weight-medium">{{ $t('stockMovements.title') }}</div>
        <div class="text-caption text-medium-emphasis">{{ $t('stockMovements.currentStock', { count: stockQuantity }) }}</div>
      </div>
      <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="openRecord">
        {{ $t('stockMovements.recordMovement') }}
      </v-btn>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-3">
      {{ errorMessage }}
    </v-alert>

    <div v-if="loading" class="d-flex justify-center py-4">
      <v-progress-circular indeterminate color="primary" size="24" />
    </div>

    <div v-else-if="!movements.length" class="text-body-2 text-medium-emphasis py-2">
      {{ $t('stockMovements.empty') }}
    </div>

    <v-table v-else density="comfortable">
      <thead>
        <tr>
          <th>{{ $t('stockMovements.date') }}</th>
          <th>{{ $t('stockMovements.type') }}</th>
          <th>{{ $t('stockMovements.qty') }}</th>
          <th>{{ $t('stockMovements.reference') }}</th>
          <th>{{ $t('stockMovements.by') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in movements" :key="m.id">
          <td>{{ new Date(m.occurred_at).toLocaleString() }}</td>
          <td>
            <v-chip size="small" :color="m.direction === 'in' ? 'success' : 'error'" variant="tonal">
              {{ typeLabel(m) }}
            </v-chip>
          </td>
          <td>{{ m.direction === 'in' ? '+' : '-' }}{{ m.quantity }}</td>
          <td>{{ m.reference || m.notes || '—' }}</td>
          <td>{{ m.performed_by?.full_name || '—' }}</td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="dialogOpen" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('stockMovements.recordStockMovement') }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="form.choice"
            :label="$t('stockMovements.movementType')"
            :items="MOVEMENT_TYPES.map((item) => ({ title: item.title, value: `${item.value}:${item.direction}` }))"
            class="mb-2"
          />
          <v-text-field
            v-model.number="form.quantity"
            type="number"
            min="1"
            :label="$t('stockMovements.quantity')"
            :error-messages="formErrors.quantity"
            class="mb-2"
          />
          <v-text-field v-model="form.reference" :label="$t('stockMovements.referenceOptional')" :hint="$t('stockMovements.referenceHint')" class="mb-2" />
          <v-textarea v-model="form.notes" :label="$t('common.notesOptional')" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">{{ $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
