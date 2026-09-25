<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useProductsStore } from '@/stores/products'
import { CustomersApi } from '@/api/customers'
import { BillingApi } from '@/api/billing'
import { LoyaltyApi } from '@/api/loyalty'
import { apiErrorMessage } from '@/api/client'
import CartPanel from '@/components/billing/CartPanel.vue'

const store = useProductsStore()
const { mobile } = useDisplay()

const search = ref('')
const searchResults = ref([])
const searching = ref(false)
let searchDebounce = null

const cart = ref([]) // { key, product_id?, variant_id?, name, sku, unit_price, tax_rate, quantity, discount_amount }
const customers = ref([])
const customerId = ref(null)
const paymentMethod = ref('cash')
const paymentAmount = ref('')
const redeemPoints = ref('')
const loyaltyProgram = ref(null)

const submitting = ref(false)
const errorMessage = ref('')
const receipt = ref(null)
const mobileCartOpen = ref(false)
const cartPanelRef = ref(null)
let idempotencyKey = crypto.randomUUID()

const cartCount = computed(() => cart.value.reduce((n, l) => n + l.quantity, 0))
const cartTotalLabel = computed(() => (cartPanelRef.value ? cartPanelRef.value.total.toFixed(2) : '0.00'))

onMounted(async () => {
  try {
    if (!store.categoriesLoaded) await store.fetchCategories()
    await runSearch()
    customers.value = await CustomersApi.list({})
    loyaltyProgram.value = await LoyaltyApi.getProgram()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  }
})

watch(search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(runSearch, 250)
})

async function runSearch() {
  searching.value = true
  try {
    const result = await store.fetchProducts({ search: search.value, page_size: 12 })
    searchResults.value = result.data
  } finally {
    searching.value = false
  }
}

function addToCart(item, target) {
  const isVariant = !!target.attributes
  const key = target.id

  const existing = cart.value.find((line) => line.key === key)
  if (existing) {
    existing.quantity += 1
    return
  }

  cart.value.push({
    key,
    product_id: isVariant ? null : target.id,
    variant_id: isVariant ? target.id : null,
    name: isVariant ? `${item.name} (${Object.values(target.attributes).join('/')})` : item.name,
    sku: target.sku,
    unit_price: Number(target.selling_price) || 0,
    tax_rate: Number(target.tax_rate) || 0,
    quantity: 1,
    discount_amount: '0',
  })

  if (mobile.value) mobileCartOpen.value = true
}

async function completeSale() {
  if (!cart.value.length) return

  submitting.value = true
  errorMessage.value = ''

  const payload = {
    customer_id: customerId.value,
    items: cart.value.map((l) => ({
      product_id: l.product_id,
      variant_id: l.variant_id,
      quantity: l.quantity,
      discount_amount: l.discount_amount,
    })),
    idempotency_key: idempotencyKey,
  }

  if (Number(redeemPoints.value) > 0) {
    payload.redeem_points = Number(redeemPoints.value)
  }

  if (Number(paymentAmount.value) > 0) {
    payload.payments = [{ method: paymentMethod.value, amount: paymentAmount.value }]
  }

  try {
    const invoice = await BillingApi.createInvoice(payload)
    receipt.value = invoice
    resetCart()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

function resetCart() {
  cart.value = []
  customerId.value = null
  paymentMethod.value = 'cash'
  paymentAmount.value = ''
  redeemPoints.value = ''
  idempotencyKey = crypto.randomUUID()
  mobileCartOpen.value = false
}

function startNewSale() {
  receipt.value = null
}
</script>

<template>
  <div>
  <v-container fluid class="py-6">
      <h1 class="text-h5 font-weight-bold mb-4">Billing</h1>

      <v-row>
        <v-col cols="12" md="7">
          <v-text-field
            id="billing-search-input"
            v-model="search"
            prepend-inner-icon="mdi-barcode-scan"
            placeholder="Search or scan by name, SKU, or barcode"
            clearable
            autofocus
            class="mb-3"
          />

          <div v-if="searching" class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <v-row v-else>
            <v-col v-for="item in searchResults" :key="item.id" cols="6" sm="6" lg="4">
              <v-card border class="pa-3 h-100 d-flex flex-column hover-lift">
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-medium-emphasis mb-2">
                  {{ item.has_variants ? `${item.variants.length} option(s)` : item.sku || item.unit }}
                </div>

                <template v-if="!item.has_variants">
                  <div class="text-body-2 mb-2">
                    {{ item.selling_price || '—' }}
                    <span v-if="item.stock_quantity <= 0" class="text-error"> · Out of stock</span>
                    <span v-else class="text-medium-emphasis"> · {{ item.stock_quantity }} in stock</span>
                  </div>
                  <v-btn
                    :id="`add-to-cart-${item.id}`"
                    size="small"
                    color="primary"
                    variant="tonal"
                    class="mt-auto"
                    @click="addToCart(item, item)"
                  >
                    Add to Cart
                  </v-btn>
                </template>

                <div v-else class="d-flex flex-wrap ga-1 mt-auto">
                  <v-chip
                    v-for="variant in item.variants"
                    :key="variant.id"
                    :id="`add-variant-to-cart-${variant.id}`"
                    size="small"
                    :disabled="variant.stock_quantity <= 0"
                    @click="addToCart(item, variant)"
                  >
                    {{ Object.values(variant.attributes).join('/') }} · {{ variant.selling_price }}
                  </v-chip>
                </div>
              </v-card>
            </v-col>

            <v-col v-if="!searchResults.length" cols="12">
              <div class="text-center text-body-2 text-medium-emphasis py-8">No products found.</div>
            </v-col>
          </v-row>
        </v-col>

        <v-col v-if="!mobile" cols="12" md="5">
          <v-card border class="pa-4" style="position: sticky; top: 16px">
            <div class="text-subtitle-1 font-weight-bold mb-3">Cart</div>
            <CartPanel
              ref="cartPanelRef"
              v-model:cart="cart"
              v-model:customer-id="customerId"
              v-model:payment-method="paymentMethod"
              v-model:payment-amount="paymentAmount"
              v-model:redeem-points="redeemPoints"
              :customers="customers"
              :submitting="submitting"
              :error-message="errorMessage"
              :loyalty-program="loyaltyProgram"
              @complete-sale="completeSale"
            />
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Mobile: a persistent cart summary bar (sticky above the bottom nav)
         that expands into the full cart - keeps "complete sale" reachable
         with one thumb, per §17's sticky-billing-actions guidance. -->
    <div v-if="mobile && cart.length" class="mobile-cart-bar" @click="mobileCartOpen = true">
      <div class="d-flex align-center pa-3">
        <v-badge :content="cartCount" color="primary" inline class="mr-2" />
        <span class="text-body-2 flex-grow-1">View Cart</span>
        <span class="text-subtitle-1 font-weight-bold">{{ cartTotalLabel }}</span>
        <v-icon icon="mdi-chevron-up" class="ml-2" />
      </div>
    </div>

    <v-bottom-sheet v-if="mobile" v-model="mobileCartOpen">
      <v-card class="pa-4" style="max-height: 85vh; overflow-y: auto">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-subtitle-1 font-weight-bold">Cart</div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="mobileCartOpen = false" />
        </div>
        <CartPanel
          v-model:cart="cart"
          v-model:customer-id="customerId"
          v-model:payment-method="paymentMethod"
          v-model:payment-amount="paymentAmount"
          v-model:redeem-points="redeemPoints"
          :customers="customers"
          :submitting="submitting"
          :error-message="errorMessage"
          :loyalty-program="loyaltyProgram"
          @complete-sale="completeSale"
        />
      </v-card>
    </v-bottom-sheet>

    <v-dialog :model-value="!!receipt" max-width="420" persistent>
      <v-card class="pa-6 text-center" v-if="receipt">
        <v-icon icon="mdi-check-circle" color="success" size="48" class="mb-3" />
        <div class="text-h6 font-weight-bold">Sale Complete</div>
        <div class="text-body-2 text-medium-emphasis mb-4">Invoice {{ receipt.invoice_number }}</div>
        <div class="text-h5 font-weight-bold mb-2">{{ receipt.currency }} {{ receipt.total_amount }}</div>
        <div v-if="receipt.loyalty_points_earned > 0 || receipt.loyalty_points_redeemed > 0" class="text-caption text-medium-emphasis mb-4">
          <span v-if="receipt.loyalty_points_redeemed > 0">Redeemed {{ receipt.loyalty_points_redeemed }} points ({{ receipt.currency }} {{ receipt.loyalty_discount_amount }} off)</span>
          <span v-if="receipt.loyalty_points_redeemed > 0 && receipt.loyalty_points_earned > 0"> &middot; </span>
          <span v-if="receipt.loyalty_points_earned > 0">Earned {{ receipt.loyalty_points_earned }} points</span>
        </div>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-printer-outline"
          block
          class="mb-2"
          :to="{ name: 'invoice-print', params: { id: receipt.id } }"
        >
          Print Receipt
        </v-btn>
        <v-btn color="primary" block @click="startNewSale">New Sale</v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.mobile-cart-bar {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 68px;
  background: rgb(var(--v-theme-primary-lighten-1));
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  border-radius: 16px;
  box-shadow: var(--shadow-lifted);
  z-index: 5;
  cursor: pointer;
}
</style>
