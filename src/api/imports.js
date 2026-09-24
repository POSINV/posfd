import client from '@/api/client'

function toFormData(file) {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

function download(promise, fallbackFilename) {
  return promise.then((response) => {
    const disposition = response.headers?.['content-disposition'] || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const filename = match ? match[1] : fallbackFilename

    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  })
}

export const ImportsApi = {
  downloadProductsTemplate: () =>
    download(client.get('/imports/products/template', { responseType: 'blob' }), 'products_import_template.csv'),
  previewProducts: (file) =>
    client.post('/imports/products/preview', toFormData(file)).then((r) => r.data.data),
  commitProducts: (rows) => client.post('/imports/products/commit', { rows }).then((r) => r.data.data),

  downloadOpeningStockTemplate: () =>
    download(
      client.get('/imports/opening_stock/template', { responseType: 'blob' }),
      'opening_stock_import_template.csv',
    ),
  previewOpeningStock: (file) =>
    client.post('/imports/opening_stock/preview', toFormData(file)).then((r) => r.data.data),
  commitOpeningStock: (rows) =>
    client.post('/imports/opening_stock/commit', { rows }).then((r) => r.data.data),

  downloadHistoricalBillsTemplate: () =>
    download(
      client.get('/imports/historical_bills/template', { responseType: 'blob' }),
      'historical_bills_import_template.csv',
    ),
  previewHistoricalBills: (file) =>
    client.post('/imports/historical_bills/preview', toFormData(file)).then((r) => r.data.data),
  commitHistoricalBills: (rows) =>
    client.post('/imports/historical_bills/commit', { rows }).then((r) => r.data.data),

  history: () => client.get('/imports/history').then((r) => r.data.data),
}
