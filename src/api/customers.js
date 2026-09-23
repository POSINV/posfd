import client from '@/api/client'

export const CustomersApi = {
  list: (params) => client.get('/customers', { params }).then((r) => r.data.data),
  create: (attrs) => client.post('/customers', { customer: attrs }).then((r) => r.data.data),
  update: (id, attrs) =>
    client.patch(`/customers/${id}`, { customer: attrs }).then((r) => r.data.data),
  remove: (id) => client.delete(`/customers/${id}`),
}
