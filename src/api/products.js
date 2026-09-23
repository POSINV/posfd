import client from '@/api/client'

export const CategoriesApi = {
  list: () => client.get('/categories').then((r) => r.data.data),
  create: (attrs) => client.post('/categories', { category: attrs }).then((r) => r.data.data),
  update: (id, attrs) =>
    client.patch(`/categories/${id}`, { category: attrs }).then((r) => r.data.data),
  remove: (id) => client.delete(`/categories/${id}`),
}

export const ProductsApi = {
  list: (params) => client.get('/products', { params }).then((r) => r.data),
  get: (id) => client.get(`/products/${id}`).then((r) => r.data.data),
  create: (attrs) => client.post('/products', { product: attrs }).then((r) => r.data.data),
  update: (id, attrs) =>
    client.patch(`/products/${id}`, { product: attrs }).then((r) => r.data.data),
  remove: (id) => client.delete(`/products/${id}`),
}

export const VariantsApi = {
  create: (productId, attrs) =>
    client.post(`/products/${productId}/variants`, { variant: attrs }).then((r) => r.data.data),
  update: (productId, id, attrs) =>
    client
      .patch(`/products/${productId}/variants/${id}`, { variant: attrs })
      .then((r) => r.data.data),
  remove: (productId, id) => client.delete(`/products/${productId}/variants/${id}`),
}

export const AttributesApi = {
  list: () => client.get('/attributes').then((r) => r.data.data),
}

export const PriceTiersApi = {
  list: (target) => client.get('/price_tiers', { params: target }).then((r) => r.data.data),
  create: (attrs) => client.post('/price_tiers', { price_tier: attrs }).then((r) => r.data.data),
  update: (id, attrs) =>
    client.patch(`/price_tiers/${id}`, { price_tier: attrs }).then((r) => r.data.data),
  remove: (id) => client.delete(`/price_tiers/${id}`),
}
