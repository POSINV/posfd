import { defineStore } from 'pinia'
import { CategoriesApi, ProductsApi, VariantsApi, AttributesApi } from '@/api/products'

export const useProductsStore = defineStore('products', {
  state: () => ({
    categories: [],
    categoriesLoaded: false,
    attributes: [],
    products: [],
    pagination: { page: 1, page_size: 25, total_count: 0 },
  }),

  actions: {
    async fetchCategories() {
      this.categories = await CategoriesApi.list()
      this.categoriesLoaded = true
    },

    async createCategory(attrs) {
      const category = await CategoriesApi.create(attrs)
      this.categories.push(category)
      return category
    },

    async updateCategory(id, attrs) {
      const category = await CategoriesApi.update(id, attrs)
      const idx = this.categories.findIndex((c) => c.id === id)
      if (idx !== -1) this.categories[idx] = category
      return category
    },

    async deleteCategory(id) {
      await CategoriesApi.remove(id)
      this.categories = this.categories.filter((c) => c.id !== id)
    },

    async fetchAttributes() {
      this.attributes = await AttributesApi.list()
    },

    async getProduct(id) {
      return ProductsApi.get(id)
    },

    async fetchProducts(params = {}) {
      const result = await ProductsApi.list(params)
      this.products = result.data
      this.pagination = result.pagination
      return result
    },

    async createProduct(attrs) {
      return ProductsApi.create(attrs)
    },

    async updateProduct(id, attrs) {
      return ProductsApi.update(id, attrs)
    },

    async deleteProduct(id) {
      await ProductsApi.remove(id)
      this.products = this.products.filter((p) => p.id !== id)
    },

    createVariant(productId, attrs) {
      return VariantsApi.create(productId, attrs)
    },

    updateVariant(productId, id, attrs) {
      return VariantsApi.update(productId, id, attrs)
    },

    deleteVariant(productId, id) {
      return VariantsApi.remove(productId, id)
    },
  },
})
