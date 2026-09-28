import client from '@/api/client'

export const OffersApi = {
  list: () => client.get('/offers').then((r) => r.data.data),
  get: (id) => client.get(`/offers/${id}`).then((r) => r.data.data),
  create: (attrs) => client.post('/offers', { offer: attrs }).then((r) => r.data.data),
  update: (id, attrs) => client.patch(`/offers/${id}`, { offer: attrs }).then((r) => r.data.data),
}
