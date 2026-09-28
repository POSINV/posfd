<script setup>
import { ref, computed, onMounted } from 'vue'
import { PriceTiersApi } from '@/api/products'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({
  productId: { type: String, default: null },
  variantId: { type: String, default: null },
  basePrice: { type: [String, Number], default: null },
})

const target = computed(() =>
  props.variantId ? { variant_id: props.variantId } : { product_id: props.productId },
)

const tiers = ref([])
const loading = ref(true)
const errorMessage = ref('')

const dialogOpen = ref(false)
const editingTier = ref(null)
const form = ref(emptyForm())
const formErrors = ref({})
const saving = ref(false)
const deleteTarget = ref(null)

function emptyForm() {
  return { label: '', min_quantity: 1, price: '', effective_from: '', effective_to: '' }
}

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    tiers.value = await PriceTiersApi.list(target.value)
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingTier.value = null
  form.value = emptyForm()
  formErrors.value = {}
  dialogOpen.value = true
}

function openEdit(tier) {
  editingTier.value = tier
  form.value = {
    label: tier.label,
    min_quantity: tier.min_quantity,
    price: tier.price,
    effective_from: tier.effective_from || '',
    effective_to: tier.effective_to || '',
  }
  formErrors.value = {}
  dialogOpen.value = true
}

async function save() {
  saving.value = true
  formErrors.value = {}

  const attrs = {
    ...form.value,
    effective_from: form.value.effective_from || null,
    effective_to: form.value.effective_to || null,
    ...target.value,
  }

  try {
    if (editingTier.value) {
      await PriceTiersApi.update(editingTier.value.id, attrs)
    } else {
      await PriceTiersApi.create(attrs)
    }
    dialogOpen.value = false
    await load()
  } catch (error) {
    formErrors.value = error?.response?.data?.errors || {}
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  await PriceTiersApi.remove(deleteTarget.value.id)
  deleteTarget.value = null
  await load()
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <div class="text-subtitle-2 font-weight-medium">{{ $t('priceTiers.title') }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ $t('priceTiers.basePrice', { price: basePrice || '—' }) }}
        </div>
      </div>
      <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="openCreate">
        {{ $t('priceTiers.addTier') }}
      </v-btn>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-3">
      {{ errorMessage }}
    </v-alert>

    <div v-if="loading" class="d-flex justify-center py-4">
      <v-progress-circular indeterminate color="primary" size="24" />
    </div>

    <div v-else-if="!tiers.length" class="text-body-2 text-medium-emphasis py-2">
      {{ $t('priceTiers.empty') }}
    </div>

    <v-table v-else density="comfortable">
      <thead>
        <tr>
          <th>{{ $t('priceTiers.label') }}</th>
          <th>{{ $t('priceTiers.minQty') }}</th>
          <th>{{ $t('products.form.sellingPrice') }}</th>
          <th>{{ $t('priceTiers.valid') }}</th>
          <th class="text-right">{{ $t('products.table.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tier in tiers" :key="tier.id">
          <td>{{ tier.label }}</td>
          <td>{{ tier.min_quantity }}+</td>
          <td>{{ tier.price }}</td>
          <td>
            <span v-if="tier.effective_from || tier.effective_to">
              {{ tier.effective_from || $t('priceTiers.anytime') }} → {{ tier.effective_to || $t('priceTiers.ongoing') }}
            </span>
            <span v-else class="text-medium-emphasis">{{ $t('priceTiers.always') }}</span>
          </td>
          <td class="text-right">
            <v-btn icon="mdi-pencil-outline" variant="text" size="x-small" @click="openEdit(tier)" />
            <v-btn
              icon="mdi-trash-can-outline"
              variant="text"
              size="x-small"
              color="error"
              @click="deleteTarget = tier"
            />
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="dialogOpen" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ editingTier ? $t('priceTiers.editTier') : $t('priceTiers.addPricingTier') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.label"
            :label="$t('priceTiers.label')"
            :hint="$t('priceTiers.labelHint')"
            :error-messages="formErrors.label"
            class="mb-2"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.min_quantity"
                type="number"
                min="1"
                :label="$t('priceTiers.minQty')"
                :error-messages="formErrors.min_quantity"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.price" :label="$t('products.form.sellingPrice')" :error-messages="formErrors.price" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.effective_from" type="date" :label="$t('priceTiers.effectiveFrom')" />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.effective_to"
                type="date"
                :label="$t('priceTiers.effectiveTo')"
                :error-messages="formErrors.effective_to"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">{{ $t('common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="!!deleteTarget" max-width="420" @update:model-value="deleteTarget = null">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('priceTiers.deleteTitle') }}</v-card-title>
        <v-card-text>{{ $t('priceTiers.deleteConfirm', { label: deleteTarget?.label }) }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTarget = null">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="error" @click="confirmDelete">{{ $t('common.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
