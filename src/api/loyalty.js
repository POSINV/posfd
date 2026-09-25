import client from '@/api/client'

export const LoyaltyApi = {
  getProgram: () => client.get('/loyalty/program').then((r) => r.data.data),
  updateProgram: (attrs) =>
    client.patch('/loyalty/program', { program: attrs }).then((r) => r.data.data),
  getLedger: (customerId, params) =>
    client.get(`/customers/${customerId}/loyalty`, { params }).then((r) => r.data),
}
