import client from '@/api/client'

export const InventoryApi = {
  listMovements: (target, params = {}) =>
    client.get('/inventory/movements', { params: { ...target, ...params } }).then((r) => r.data),
  recordMovement: (target, attrs) =>
    client
      .post('/inventory/movements', { movement: { ...target, ...attrs } })
      .then((r) => r.data.data),
}
