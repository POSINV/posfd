import client from '@/api/client'

export const BusinessesApi = {
  get: (id) => client.get(`/businesses/${id}`).then((r) => r.data.data),
  update: (id, attrs) => client.patch(`/businesses/${id}`, { business: attrs }).then((r) => r.data.data),
}
