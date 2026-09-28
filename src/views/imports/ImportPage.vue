<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ImportsApi } from '@/api/imports'
import BulkImportPanel from '@/components/imports/BulkImportPanel.vue'

const { t } = useI18n()
const tab = ref('products')
const history = ref([])

const productColumns = computed(() => [
  { key: 'name', label: t('common.name') },
  { key: 'category', label: t('products.table.category') },
  { key: 'sku', label: t('products.form.sku') },
  { key: 'selling_price', label: t('products.form.sellingPrice') },
  { key: 'opening_stock', label: t('imports.openingStock') },
])

const stockColumns = computed(() => [
  { key: 'sku', label: t('products.form.sku') },
  { key: 'quantity', label: t('stockMovements.quantity') },
  { key: 'purchase_price', label: t('products.form.purchasePrice') },
  { key: 'selling_price', label: t('products.form.sellingPrice') },
])

const billColumns = computed(() => [
  { key: 'invoice_number', label: t('invoices.invoiceHash') },
  { key: 'date', label: t('stockMovements.date') },
  { key: 'sku', label: t('products.form.sku') },
  { key: 'quantity', label: t('stockMovements.qty') },
  { key: 'unit_price', label: t('invoices.unitPrice') },
  { key: 'amount_paid', label: t('imports.amountPaid') },
])

onMounted(loadHistory)
watch(tab, loadHistory)

async function loadHistory() {
  history.value = await ImportsApi.history()
}

function typeLabel(type) {
  return (
    {
      products: t('nav.products'),
      opening_stock: t('imports.openingStock'),
      historical_bills: t('imports.historicalBills'),
    }[type] || type
  )
}
</script>

<template>
  <v-container max-width="900" class="py-8">
    <h1 class="text-h5 font-weight-bold mb-1">{{ $t('nav.bulkImport') }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      {{ $t('imports.subtitle') }}
    </p>

    <v-tabs v-model="tab" class="mb-6">
      <v-tab value="products">{{ $t('nav.products') }}</v-tab>
      <v-tab value="opening_stock">{{ $t('imports.openingStock') }}</v-tab>
      <v-tab value="historical_bills">{{ $t('imports.historicalBills') }}</v-tab>
      <v-tab value="history">{{ $t('imports.history') }}</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="products">
        <BulkImportPanel
          :title="$t('imports.importProducts')"
          :description="$t('imports.importProductsDescription')"
          :columns="productColumns"
          :preview-fn="ImportsApi.previewProducts"
          :commit-fn="ImportsApi.commitProducts"
          :download-template-fn="ImportsApi.downloadProductsTemplate"
          @imported="loadHistory"
        />
      </v-window-item>

      <v-window-item value="opening_stock">
        <BulkImportPanel
          :title="$t('imports.importOpeningStock')"
          :description="$t('imports.importOpeningStockDescription')"
          :columns="stockColumns"
          :preview-fn="ImportsApi.previewOpeningStock"
          :commit-fn="ImportsApi.commitOpeningStock"
          :download-template-fn="ImportsApi.downloadOpeningStockTemplate"
          @imported="loadHistory"
        />
      </v-window-item>

      <v-window-item value="historical_bills">
        <BulkImportPanel
          :title="$t('imports.importHistoricalBills')"
          :description="$t('imports.importHistoricalBillsDescription')"
          :columns="billColumns"
          :preview-fn="ImportsApi.previewHistoricalBills"
          :commit-fn="ImportsApi.commitHistoricalBills"
          :download-template-fn="ImportsApi.downloadHistoricalBillsTemplate"
          :item-label="$t('invoices.invoice')"
          @imported="loadHistory"
        />
      </v-window-item>

      <v-window-item value="history">
        <v-card border>
          <div v-if="!history.length" class="pa-12 text-center">
            <v-icon icon="mdi-history" size="40" color="medium-emphasis" class="mb-3" />
            <div class="text-body-1 font-weight-medium">{{ $t('imports.noImportsYet') }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ $t('imports.emptyHint') }}</div>
          </div>
          <v-list v-else lines="two">
            <v-list-item v-for="log in history" :key="log.id">
              <v-list-item-title class="font-weight-medium">{{ typeLabel(log.import_type) }}</v-list-item-title>
              <v-list-item-subtitle>{{ new Date(log.inserted_at).toLocaleString() }}</v-list-item-subtitle>
              <template #append>
                <v-chip size="small" color="success" variant="tonal" class="mr-1">{{ $t('imports.okCount', { count: log.success_count }) }}</v-chip>
                <v-chip v-if="log.error_count > 0" size="small" color="error" variant="tonal">{{ $t('imports.failedCount', { count: log.error_count }) }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>
