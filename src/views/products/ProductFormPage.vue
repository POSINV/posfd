<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProductsStore } from '@/stores/products'
import { apiErrorMessage } from '@/api/client'
import VariantFormDialog from '@/components/products/VariantFormDialog.vue'
import PriceTiersManager from '@/components/products/PriceTiersManager.vue'
import StockMovementsPanel from '@/components/products/StockMovementsPanel.vue'

const props = defineProps({ id: { type: String, default: null } })
const router = useRouter()
const store = useProductsStore()
const { t } = useI18n()

const statusOptions = computed(() => [
  { title: t('products.form.statusActive'), value: 'active' },
  { title: t('products.form.statusInactive'), value: 'inactive' },
  { title: t('products.form.statusDraft'), value: 'draft' },
])

const productId = ref(props.id)
const isEdit = computed(() => !!productId.value)

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const formErrors = ref({})

const form = ref({
  name: '',
  category_id: null,
  brand: '',
  unit: 'pcs',
  status: 'active',
  has_variants: false,
  sku: '',
  barcode: '',
  purchase_price: '',
  selling_price: '',
  mrp: '',
  tax_rate: '0',
  reorder_level: 0,
})
const stockQuantity = ref(0)

const variants = ref([])
const variantDialogOpen = ref(false)
const editingVariant = ref(null)
const variantDeleteTarget = ref(null)
const pricingVariant = ref(null)
const stockVariant = ref(null)

onMounted(async () => {
  try {
    if (!store.categoriesLoaded) await store.fetchCategories()
    await store.fetchAttributes()

    if (isEdit.value) {
      await loadProduct()
    }
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
})

async function loadProduct() {
  const product = await store.getProduct(productId.value)
  form.value = {
    name: product.name,
    category_id: product.category_id,
    brand: product.brand || '',
    unit: product.unit,
    status: product.status,
    has_variants: product.has_variants,
    sku: product.sku || '',
    barcode: product.barcode || '',
    purchase_price: product.purchase_price || '',
    selling_price: product.selling_price || '',
    mrp: product.mrp || '',
    tax_rate: product.tax_rate || '0',
    reorder_level: product.reorder_level || 0,
  }
  stockQuantity.value = product.stock_quantity || 0
  variants.value = product.variants
}

async function refreshVariants() {
  const product = await store.getProduct(productId.value)
  variants.value = product.variants
  if (stockVariant.value) {
    stockVariant.value = variants.value.find((v) => v.id === stockVariant.value.id) || null
  }
}

function attrsForSubmit() {
  const attrs = { ...form.value }
  if (attrs.has_variants) {
    // Variant-level fields own pricing/identifiers when the product has variants.
    delete attrs.sku
    delete attrs.barcode
    delete attrs.purchase_price
    delete attrs.selling_price
    delete attrs.mrp
  }
  return attrs
}

async function save() {
  saving.value = true
  formErrors.value = {}
  errorMessage.value = ''

  try {
    if (isEdit.value) {
      await store.updateProduct(productId.value, attrsForSubmit())
      if (!form.value.has_variants) router.push({ name: 'products' })
    } else {
      const product = await store.createProduct(attrsForSubmit())
      if (form.value.has_variants) {
        productId.value = product.id
        router.replace({ name: 'product-edit', params: { id: product.id } })
      } else {
        router.push({ name: 'products' })
      }
    }
  } catch (error) {
    if (error?.response?.data?.errors) {
      formErrors.value = error.response.data.errors
    } else {
      errorMessage.value = apiErrorMessage(error)
    }
  } finally {
    saving.value = false
  }
}

function openAddVariant() {
  editingVariant.value = null
  variantDialogOpen.value = true
}

function openEditVariant(variant) {
  editingVariant.value = variant
  variantDialogOpen.value = true
}

async function onVariantSaved(variant) {
  const idx = variants.value.findIndex((v) => v.id === variant.id)
  if (idx === -1) {
    variants.value.push(variant)
  } else {
    variants.value[idx] = variant
  }
  variantDialogOpen.value = false
}

async function confirmDeleteVariant() {
  await store.deleteVariant(productId.value, variantDeleteTarget.value.id)
  variants.value = variants.value.filter((v) => v.id !== variantDeleteTarget.value.id)
  variantDeleteTarget.value = null
}

function variantLabel(variant) {
  const attrs = Object.entries(variant.attributes || {})
  return attrs.length ? attrs.map(([k, v]) => `${k}: ${v}`).join(', ') : variant.sku || t('products.form.variant')
}
</script>

<template>
  <div>
  <v-container max-width="800" class="py-8">
      <div class="d-flex align-center mb-6">
        <v-btn icon="mdi-arrow-left" variant="text" :to="{ name: 'products' }" class="mr-2" />
        <h1 class="text-h5 font-weight-bold">{{ isEdit ? $t('products.form.editProduct') : $t('products.form.addProduct') }}</h1>
      </div>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else>
        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

        <v-card class="pa-6 mb-6" border>
          <v-form @submit.prevent="save">
            <v-text-field
              id="product-name-input"
              v-model="form.name"
              :label="$t('products.form.productName')"
              :error-messages="formErrors.name"
              class="mb-2"
            />

            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  id="product-category-select"
                  v-model="form.category_id"
                  :label="$t('products.table.category')"
                  :items="store.categories.map((c) => ({ title: c.name, value: c.id }))"
                  clearable
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field id="product-brand-input" v-model="form.brand" :label="$t('products.form.brand')" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field id="product-unit-input" v-model="form.unit" :label="$t('products.form.unit')" :hint="$t('products.form.unitHint')" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  id="product-status-select"
                  v-model="form.status"
                  :label="$t('products.table.status')"
                  :items="statusOptions"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  id="product-tax-rate-input"
                  v-model="form.tax_rate"
                  :label="$t('products.form.taxRate')"
                  :error-messages="formErrors.tax_rate"
                />
              </v-col>
            </v-row>

            <v-switch
              id="product-has-variants-switch"
              v-model="form.has_variants"
              color="primary"
              :label="$t('products.form.hasVariants')"
              class="mb-2"
            />

            <v-row v-if="!form.has_variants">
              <v-col cols="12" sm="6">
                <v-text-field id="product-sku-input" v-model="form.sku" :label="$t('products.form.sku')" :error-messages="formErrors.sku" />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field id="product-barcode-input" v-model="form.barcode" :label="$t('products.form.barcode')" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field id="product-purchase-price-input" v-model="form.purchase_price" :label="$t('products.form.purchasePrice')" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field id="product-selling-price-input" v-model="form.selling_price" :label="$t('products.form.sellingPrice')" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field id="product-mrp-input" v-model="form.mrp" :label="$t('products.form.mrp')" />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  id="product-reorder-level-input"
                  v-model.number="form.reorder_level"
                  type="number"
                  min="0"
                  :label="$t('products.form.reorderLevel')"
                  :hint="$t('products.form.reorderLevelHint')"
                  persistent-hint
                />
              </v-col>
            </v-row>
            <v-alert v-else type="info" variant="tonal" density="comfortable" class="mb-2">
              {{ $t('products.form.pricingPerVariant') }}
              <span v-if="!isEdit">{{ $t('products.form.saveFirstHint') }}</span>
            </v-alert>

            <div class="d-flex justify-end mt-4">
              <v-btn id="save-product-btn" type="submit" color="primary" :loading="saving">
                {{ isEdit ? $t('products.form.saveChanges') : $t('products.form.saveProduct') }}
              </v-btn>
            </div>
          </v-form>
        </v-card>

        <v-card v-if="isEdit && !form.has_variants" class="pa-6 mb-6" border>
          <StockMovementsPanel
            :product-id="productId"
            :stock-quantity="stockQuantity"
            @stock-changed="loadProduct"
          />
        </v-card>

        <v-card v-if="isEdit && !form.has_variants" class="pa-6 mb-6" border>
          <PriceTiersManager :product-id="productId" :base-price="form.selling_price" />
        </v-card>

        <v-card v-if="form.has_variants && isEdit" class="pa-6" border>
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">{{ $t('products.form.variants') }}</h2>
            <v-btn id="add-variant-btn" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="openAddVariant">
              {{ $t('products.form.addVariant') }}
            </v-btn>
          </div>

          <div v-if="!variants.length" class="text-body-2 text-medium-emphasis text-center py-8">
            {{ $t('products.form.noVariants') }}
          </div>

          <v-list v-else>
            <v-list-item v-for="variant in variants" :key="variant.id" :id="`variant-row-${variant.id}`">
              <v-list-item-title>{{ variantLabel(variant) }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ $t('products.form.skuColon', { sku: variant.sku || '—' }) }} · {{ $t('products.form.sellingPriceColon', { price: variant.selling_price || '—' }) }} · {{ $t('products.form.stockColon', { count: variant.stock_quantity }) }}
                <v-icon v-if="variant.low_stock" icon="mdi-alert-circle" color="warning" size="16" class="ml-1" />
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon="mdi-cube-outline"
                  variant="text"
                  size="small"
                  :title="$t('products.form.manageStock')"
                  @click="stockVariant = variant"
                />
                <v-btn
                  icon="mdi-currency-usd"
                  variant="text"
                  size="small"
                  :title="$t('products.form.managePricingTiers')"
                  @click="pricingVariant = variant"
                />
                <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="openEditVariant(variant)" />
                <v-btn
                  icon="mdi-trash-can-outline"
                  variant="text"
                  size="small"
                  color="error"
                  @click="variantDeleteTarget = variant"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </template>
    </v-container>

    <VariantFormDialog
      v-if="variantDialogOpen"
      :product-id="productId"
      :variant="editingVariant"
      :available-attributes="store.attributes"
      @saved="onVariantSaved"
      @close="variantDialogOpen = false"
    />

    <v-dialog
      :model-value="!!variantDeleteTarget"
      max-width="420"
      @update:model-value="variantDeleteTarget = null"
    >
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('products.form.deleteVariantTitle') }}</v-card-title>
        <v-card-text>{{ $t('products.form.deleteVariantConfirm', { name: variantLabel(variantDeleteTarget || {}) }) }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="variantDeleteTarget = null">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="error" @click="confirmDeleteVariant">{{ $t('common.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="!!pricingVariant" max-width="640" @update:model-value="pricingVariant = null">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('products.form.pricingFor', { name: variantLabel(pricingVariant || {}) }) }}</v-card-title>
        <v-card-text>
          <PriceTiersManager
            v-if="pricingVariant"
            :variant-id="pricingVariant.id"
            :base-price="pricingVariant.selling_price"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="pricingVariant = null">{{ $t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="!!stockVariant" max-width="640" @update:model-value="stockVariant = null">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('products.form.stockFor', { name: variantLabel(stockVariant || {}) }) }}</v-card-title>
        <v-card-text>
          <StockMovementsPanel
            v-if="stockVariant"
            :variant-id="stockVariant.id"
            :stock-quantity="stockVariant.stock_quantity"
            @stock-changed="refreshVariants"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="stockVariant = null">{{ $t('common.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
