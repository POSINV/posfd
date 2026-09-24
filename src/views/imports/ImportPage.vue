<script setup>
import { ref, onMounted, watch } from 'vue'
import { ImportsApi } from '@/api/imports'
import BulkImportPanel from '@/components/imports/BulkImportPanel.vue'

const tab = ref('products')
const history = ref([])

const productColumns = [
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'sku', label: 'SKU' },
  { key: 'selling_price', label: 'Selling Price' },
  { key: 'opening_stock', label: 'Opening Stock' },
]

const stockColumns = [
  { key: 'sku', label: 'SKU' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'selling_price', label: 'Selling Price' },
]

const billColumns = [
  { key: 'invoice_number', label: 'Invoice #' },
  { key: 'date', label: 'Date' },
  { key: 'sku', label: 'SKU' },
  { key: 'quantity', label: 'Qty' },
  { key: 'unit_price', label: 'Unit Price' },
  { key: 'amount_paid', label: 'Amount Paid' },
]

onMounted(loadHistory)
watch(tab, loadHistory)

async function loadHistory() {
  history.value = await ImportsApi.history()
}

function typeLabel(type) {
  return (
    { products: 'Products', opening_stock: 'Opening Stock', historical_bills: 'Historical Bills' }[
      type
    ] || type
  )
}
</script>

<template>
  <v-container max-width="900" class="py-8">
    <h1 class="text-h5 font-weight-bold mb-1">Bulk Import</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Bring in products or stock from a spreadsheet. Download a template, fill it in, upload it,
      review what will happen, then confirm.
    </p>

    <v-tabs v-model="tab" class="mb-6">
      <v-tab value="products">Products</v-tab>
      <v-tab value="opening_stock">Opening Stock</v-tab>
      <v-tab value="historical_bills">Historical Bills</v-tab>
      <v-tab value="history">History</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="products">
        <BulkImportPanel
          title="Import Products"
          description="Creates new simple (non-variant) products. Include an opening_stock column to set starting stock in the same step. Categories must already exist - create them first if needed."
          :columns="productColumns"
          :preview-fn="ImportsApi.previewProducts"
          :commit-fn="ImportsApi.commitProducts"
          :download-template-fn="ImportsApi.downloadProductsTemplate"
          @imported="loadHistory"
        />
      </v-window-item>

      <v-window-item value="opening_stock">
        <BulkImportPanel
          title="Import Opening Stock"
          description="Adds stock to products that already exist, matched by SKU. Purchase/selling price columns are optional - leave blank to keep the current price."
          :columns="stockColumns"
          :preview-fn="ImportsApi.previewOpeningStock"
          :commit-fn="ImportsApi.commitOpeningStock"
          :download-template-fn="ImportsApi.downloadOpeningStockTemplate"
          @imported="loadHistory"
        />
      </v-window-item>

      <v-window-item value="historical_bills">
        <BulkImportPanel
          title="Import Historical Bills"
          description="Brings in past invoices from your old system so reports and customer history stay complete. Rows sharing the same invoice_number become one invoice - list each line item on its own row. Products must already exist (import them first), and this never touches current stock, since it's already reflected in whatever opening stock you imported."
          :columns="billColumns"
          :preview-fn="ImportsApi.previewHistoricalBills"
          :commit-fn="ImportsApi.commitHistoricalBills"
          :download-template-fn="ImportsApi.downloadHistoricalBillsTemplate"
          item-label="Invoice"
          @imported="loadHistory"
        />
      </v-window-item>

      <v-window-item value="history">
        <v-card border>
          <div v-if="!history.length" class="pa-12 text-center">
            <v-icon icon="mdi-history" size="40" color="medium-emphasis" class="mb-3" />
            <div class="text-body-1 font-weight-medium">No imports yet</div>
            <div class="text-body-2 text-medium-emphasis">Runs from the Products, Opening Stock, and Historical Bills tabs show up here.</div>
          </div>
          <v-list v-else lines="two">
            <v-list-item v-for="log in history" :key="log.id">
              <v-list-item-title class="font-weight-medium">{{ typeLabel(log.import_type) }}</v-list-item-title>
              <v-list-item-subtitle>{{ new Date(log.inserted_at).toLocaleString() }}</v-list-item-subtitle>
              <template #append>
                <v-chip size="small" color="success" variant="tonal" class="mr-1">{{ log.success_count }} ok</v-chip>
                <v-chip v-if="log.error_count > 0" size="small" color="error" variant="tonal">{{ log.error_count }} failed</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>
