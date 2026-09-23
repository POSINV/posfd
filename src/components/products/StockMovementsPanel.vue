<script setup>
import { ref, computed, onMounted } from 'vue'
import { InventoryApi } from '@/api/inventory'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({
  productId: { type: String, default: null },
  variantId: { type: String, default: null },
  stockQuantity: { type: Number, default: 0 },
})
const emit = defineEmits(['stock-changed'])

const target = computed(() =>
  props.variantId ? { variant_id: props.variantId } : { product_id: props.productId },
)

const movements = ref([])
const loading = ref(true)
const errorMessage = ref('')

const dialogOpen = ref(false)
const saving = ref(false)
const formErrors = ref({})

const MOVEMENT_TYPES = [
  { title: 'Opening Stock', value: 'opening_stock', direction: 'in' },
  { title: 'Purchase (stock in)', value: 'purchase', direction: 'in' },
  { title: 'Sale (stock out)', value: 'sale', direction: 'out' },
  { title: 'Return (stock in)', value: 'return', direction: 'in' },
  { title: 'Adjustment - increase', value: 'adjustment', direction: 'in' },
  { title: 'Adjustment - decrease', value: 'adjustment', direction: 'out' },
]

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
  const match = MOVEMENT_TYPES.find((t) => t.value === m.movement_type && t.direction === m.direction)
  return match?.title || m.movement_type
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <div class="text-subtitle-2 font-weight-medium">Stock movements</div>
        <div class="text-caption text-medium-emphasis">Current stock: {{ stockQuantity }}</div>
      </div>
      <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="openRecord">
        Record Movement
      </v-btn>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-3">
      {{ errorMessage }}
    </v-alert>

    <div v-if="loading" class="d-flex justify-center py-4">
      <v-progress-circular indeterminate color="primary" size="24" />
    </div>

    <div v-else-if="!movements.length" class="text-body-2 text-medium-emphasis py-2">
      No stock movements yet. Record opening stock to get started.
    </div>

    <v-table v-else density="comfortable">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Qty</th>
          <th>Reference</th>
          <th>By</th>
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
        <v-card-title class="font-weight-bold">Record Stock Movement</v-card-title>
        <v-card-text>
          <v-select
            v-model="form.choice"
            label="Movement type"
            :items="MOVEMENT_TYPES.map((t) => ({ title: t.title, value: `${t.value}:${t.direction}` }))"
            class="mb-2"
          />
          <v-text-field
            v-model.number="form.quantity"
            type="number"
            min="1"
            label="Quantity"
            :error-messages="formErrors.quantity"
            class="mb-2"
          />
          <v-text-field v-model="form.reference" label="Reference (optional)" hint="e.g. PO-1023, INV-2044" class="mb-2" />
          <v-textarea v-model="form.notes" label="Notes (optional)" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
