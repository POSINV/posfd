import client from '@/api/client'

export const ReportsApi = {
  salesSummary: (from, to) =>
    client.get('/reports/sales_summary', { params: { from, to } }).then((r) => r.data.data),
  dailySales: (from, to) =>
    client.get('/reports/daily_sales', { params: { from, to } }).then((r) => r.data.data),
  topProducts: (from, to, limit = 10) =>
    client.get('/reports/top_products', { params: { from, to, limit } }).then((r) => r.data.data),
  stock: (lowStockOnly = false) =>
    client
      .get('/reports/stock', { params: { low_stock_only: lowStockOnly } })
      .then((r) => r.data.data),
  loyalty: (from, to) =>
    client.get('/reports/loyalty', { params: { from, to } }).then((r) => r.data.data),
}
