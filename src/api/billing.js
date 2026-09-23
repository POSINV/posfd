import client from '@/api/client'

export const BillingApi = {
  createInvoice: (attrs) => client.post('/invoices', attrs).then((r) => r.data.data),
  listInvoices: (params) => client.get('/invoices', { params }).then((r) => r.data),
  getInvoice: (id) => client.get(`/invoices/${id}`).then((r) => r.data.data),
  addPayment: (id, attrs) =>
    client.post(`/invoices/${id}/payments`, { payment: attrs }).then((r) => r.data.data),
  cancelInvoice: (id) => client.post(`/invoices/${id}/cancel`).then((r) => r.data.data),
}
