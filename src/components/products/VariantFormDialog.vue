<script setup>
import { ref, computed } from 'vue'
import { useProductsStore } from '@/stores/products'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({
  productId: { type: String, required: true },
  variant: { type: Object, default: null },
  availableAttributes: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved', 'close'])

const store = useProductsStore()
const isEdit = computed(() => !!props.variant)

const form = ref({
  sku: props.variant?.sku || '',
  barcode: props.variant?.barcode || '',
  purchase_price: props.variant?.purchase_price || '',
  selling_price: props.variant?.selling_price || '',
  mrp: props.variant?.mrp || '',
  reorder_level: props.variant?.reorder_level || 0,
})

const attributeRows = ref(
  Object.entries(props.variant?.attributes || {}).map(([name, value]) => ({ name, value })),
)
if (!attributeRows.value.length) attributeRows.value.push({ name: '', value: '' })

const saving = ref(false)
const errorMessage = ref('')

const attributeNames = computed(() => props.availableAttributes.map((a) => a.name))

function valuesFor(name) {
  return props.availableAttributes.find((a) => a.name === name)?.values || []
}

function addRow() {
  attributeRows.value.push({ name: '', value: '' })
}

function removeRow(index) {
  attributeRows.value.splice(index, 1)
}

async function save() {
  saving.value = true
  errorMessage.value = ''

  const attributes = {}
  for (const row of attributeRows.value) {
    if (row.name && row.value) attributes[row.name] = row.value
  }

  const attrs = { ...form.value, attributes }

  try {
    const saved = isEdit.value
      ? await store.updateVariant(props.productId, props.variant.id, attrs)
      : await store.createVariant(props.productId, attrs)
    emit('saved', saved)
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <v-dialog :model-value="true" max-width="560" @update:model-value="$emit('close')">
    <v-card class="pa-4">
      <v-card-title class="font-weight-bold">{{ isEdit ? 'Edit Variant' : 'Add Variant' }}</v-card-title>
      <v-card-text>
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field id="variant-sku-input" v-model="form.sku" label="SKU" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field id="variant-barcode-input" v-model="form.barcode" label="Barcode" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field id="variant-purchase-price-input" v-model="form.purchase_price" label="Purchase price" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field id="variant-selling-price-input" v-model="form.selling_price" label="Selling price" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field id="variant-mrp-input" v-model="form.mrp" label="MRP" />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              id="variant-reorder-level-input"
              v-model.number="form.reorder_level"
              type="number"
              min="0"
              label="Reorder level"
            />
          </v-col>
        </v-row>

        <div class="text-subtitle-2 font-weight-medium mb-2">Attributes</div>
        <div v-for="(row, index) in attributeRows" :key="index" class="d-flex ga-2 mb-2">
          <v-combobox
            v-model="row.name"
            :items="attributeNames"
            label="Attribute (e.g. Size)"
            density="comfortable"
            hide-details
          />
          <v-combobox
            v-model="row.value"
            :items="valuesFor(row.name)"
            label="Value (e.g. M)"
            density="comfortable"
            hide-details
          />
          <v-btn icon="mdi-close" variant="text" size="small" @click="removeRow(index)" />
        </div>
        <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="addRow">Add attribute</v-btn>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">Cancel</v-btn>
        <v-btn id="save-variant-btn" color="primary" :loading="saving" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
