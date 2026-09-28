<script setup>
import { ref, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useProductsStore } from '@/stores/products'
import { apiErrorMessage } from '@/api/client'

const store = useProductsStore()
const { mobile } = useDisplay()

const loading = ref(true)
const errorMessage = ref('')
const search = ref('')
const page = ref(1)

const deleteTarget = ref(null)
const deleting = ref(false)

let searchDebounce = null

onMounted(async () => {
  try {
    if (!store.categoriesLoaded) await store.fetchCategories()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
  await load()
})

watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})

watch(page, load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    await store.fetchProducts({ search: search.value, page: page.value })
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function categoryName(id) {
  return store.categories.find((c) => c.id === id)?.name || '—'
}

function priceLabel(product) {
  if (product.has_variants) {
    const prices = product.variants.map((v) => Number(v.selling_price)).filter((n) => !isNaN(n))
    if (!prices.length) return '—'
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`
  }
  return product.selling_price ? formatMoney(Number(product.selling_price)) : '—'
}

function formatMoney(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function stockLabel(product) {
  if (!product.has_variants) return product.stock_quantity
  return product.variants.reduce((sum, v) => sum + v.stock_quantity, 0)
}

function isLowStock(product) {
  if (!product.has_variants) return product.low_stock
  return product.variants.some((v) => v.low_stock)
}

async function confirmDelete() {
  deleting.value = true
  try {
    await store.deleteProduct(deleteTarget.value.id)
    deleteTarget.value = null
    await load()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    deleting.value = false
  }
}

const totalPages = () =>
  Math.max(1, Math.ceil(store.pagination.total_count / store.pagination.page_size))
</script>

<template>
  <div>
  <v-container class="py-8">
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-4">
        <div>
          <h1 class="text-h5 font-weight-bold">{{ $t('products.title') }}</h1>
          <p class="text-body-2 text-medium-emphasis">
            {{ $t('products.count', { count: store.pagination.total_count }) }}
          </p>
        </div>
        <v-btn id="add-product-btn" color="primary" prepend-icon="mdi-plus" :to="{ name: 'product-new' }">
          {{ $t('products.addProduct') }}
        </v-btn>
      </div>

      <v-text-field
        id="product-search-input"
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        :placeholder="$t('products.searchPlaceholder')"
        clearable
        class="mb-4"
        style="max-width: 420px"
      />

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-card v-else border>
        <div v-if="!store.products.length" id="products-empty" class="pa-12 text-center">
          <v-icon icon="mdi-package-variant" size="40" color="medium-emphasis" class="mb-3" />
          <div class="text-body-1 font-weight-medium">{{ $t('products.emptyTitle') }}</div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            {{ $t('dashboard.addFirstProductHint') }}
          </div>
          <v-btn color="primary" :to="{ name: 'product-new' }">{{ $t('products.addProduct') }}</v-btn>
        </div>

        <!-- Phones: stacked cards, one tap target per row, no horizontal
             scrolling or squinting at a cramped table (§17). -->
        <div v-if="mobile">
          <div
            v-for="product in store.products"
            :key="product.id"
            :id="`product-row-${product.id}`"
            class="product-card-row pa-4"
          >
            <div class="d-flex justify-space-between align-start">
              <div>
                <div class="font-weight-medium">{{ product.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ categoryName(product.category_id) }}
                  <template v-if="product.sku"> · {{ $t('products.skuLabel', { sku: product.sku }) }}</template>
                </div>
              </div>
              <v-chip size="small" :color="product.status === 'active' ? 'success' : 'default'" variant="tonal">
                {{ $t(`common.productStatus.${product.status}`) }}
              </v-chip>
            </div>
            <div class="d-flex align-center justify-space-between mt-3">
              <div>
                <div class="text-body-2 font-weight-bold">{{ priceLabel(product) }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ $t('products.stockLabel', { count: stockLabel(product) }) }}
                  <v-icon v-if="isLowStock(product)" icon="mdi-alert-circle" color="warning" size="14" class="ml-1" />
                </div>
              </div>
              <div>
                <v-btn
                  :id="`edit-product-${product.id}`"
                  icon="mdi-pencil-outline"
                  variant="text"
                  size="small"
                  :to="{ name: 'product-edit', params: { id: product.id } }"
                />
                <v-btn
                  :id="`delete-product-${product.id}`"
                  icon="mdi-trash-can-outline"
                  variant="text"
                  size="small"
                  color="error"
                  @click="deleteTarget = product"
                />
              </div>
            </div>
          </div>
        </div>

        <v-table v-else>
          <thead>
            <tr>
              <th>{{ $t('common.name') }}</th>
              <th>{{ $t('products.table.category') }}</th>
              <th>{{ $t('products.table.variants') }}</th>
              <th>{{ $t('products.table.price') }}</th>
              <th>{{ $t('products.table.stock') }}</th>
              <th>{{ $t('products.table.status') }}</th>
              <th class="text-right">{{ $t('products.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in store.products" :key="product.id" :id="`product-row-${product.id}`">
              <td>
                <div class="font-weight-medium">{{ product.name }}</div>
                <div v-if="product.sku" class="text-caption text-medium-emphasis">{{ $t('products.skuLabel', { sku: product.sku }) }}</div>
              </td>
              <td>{{ categoryName(product.category_id) }}</td>
              <td>{{ product.has_variants ? $t('products.variantsCount', { count: product.variants.length }) : '—' }}</td>
              <td>{{ priceLabel(product) }}</td>
              <td>
                <span>{{ stockLabel(product) }}</span>
                <v-icon v-if="isLowStock(product)" icon="mdi-alert-circle" color="warning" size="16" class="ml-1" />
              </td>
              <td>
                <v-chip
                  size="small"
                  :color="product.status === 'active' ? 'success' : 'default'"
                  variant="tonal"
                >
                  {{ $t(`common.productStatus.${product.status}`) }}
                </v-chip>
              </td>
              <td class="text-right">
                <v-btn
                  :id="`edit-product-${product.id}`"
                  icon="mdi-pencil-outline"
                  variant="text"
                  size="small"
                  :to="{ name: 'product-edit', params: { id: product.id } }"
                />
                <v-btn
                  :id="`delete-product-${product.id}`"
                  icon="mdi-trash-can-outline"
                  variant="text"
                  size="small"
                  color="error"
                  @click="deleteTarget = product"
                />
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="store.products.length" class="d-flex justify-center pa-4">
          <v-pagination
            id="products-pagination"
            v-model="page"
            :length="totalPages()"
            :total-visible="5"
            density="comfortable"
          />
        </div>
      </v-card>
    </v-container>

    <v-dialog :model-value="!!deleteTarget" max-width="420" @update:model-value="deleteTarget = null">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">{{ $t('products.deleteTitle') }}</v-card-title>
        <v-card-text>{{ $t('products.deleteConfirm', { name: deleteTarget?.name }) }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTarget = null">{{ $t('common.cancel') }}</v-btn>
          <v-btn id="confirm-delete-product-btn" color="error" :loading="deleting" @click="confirmDelete">
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.product-card-row + .product-card-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
