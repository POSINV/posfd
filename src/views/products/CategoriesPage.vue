<script setup>
import { ref, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { apiErrorMessage } from '@/api/client'

const store = useProductsStore()
const loading = ref(true)
const errorMessage = ref('')

const dialogOpen = ref(false)
const editingCategory = ref(null)
const form = ref({ name: '', parent_id: null })
const formErrors = ref({})
const saving = ref(false)

const deleteTarget = ref(null)
const deleting = ref(false)

onMounted(load)

async function load() {
  loading.value = true
  try {
    await store.fetchCategories()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingCategory.value = null
  form.value = { name: '', parent_id: null }
  formErrors.value = {}
  dialogOpen.value = true
}

function openEdit(category) {
  editingCategory.value = category
  form.value = { name: category.name, parent_id: category.parent_id }
  formErrors.value = {}
  dialogOpen.value = true
}

async function save() {
  saving.value = true
  formErrors.value = {}

  try {
    if (editingCategory.value) {
      await store.updateCategory(editingCategory.value.id, form.value)
    } else {
      await store.createCategory(form.value)
    }
    dialogOpen.value = false
  } catch (error) {
    formErrors.value = error?.response?.data?.errors || {}
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  deleting.value = true
  try {
    await store.deleteCategory(deleteTarget.value.id)
    deleteTarget.value = null
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    deleting.value = false
  }
}

function parentOptions(excludeId) {
  return store.categories
    .filter((c) => c.id !== excludeId)
    .map((c) => ({ title: c.name, value: c.id }))
}
</script>

<template>
  <div>
  <v-container class="py-8">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h5 font-weight-bold">Categories</h1>
          <p class="text-body-2 text-medium-emphasis">Organize your products into categories</p>
        </div>
        <v-btn id="add-category-btn" color="primary" prepend-icon="mdi-plus" @click="openCreate">
          Add Category
        </v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <div v-if="loading" class="d-flex justify-center py-12">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-card v-else border>
        <div v-if="!store.categories.length" id="categories-empty" class="pa-12 text-center">
          <v-icon icon="mdi-shape-outline" size="40" color="medium-emphasis" class="mb-3" />
          <div class="text-body-1 font-weight-medium">No categories yet</div>
          <div class="text-body-2 text-medium-emphasis">Add your first category to start organizing products.</div>
        </div>

        <v-list v-else lines="two">
          <v-list-item
            v-for="category in store.categories"
            :key="category.id"
            :id="`category-row-${category.id}`"
          >
            <v-list-item-title>{{ category.name }}</v-list-item-title>
            <v-list-item-subtitle v-if="category.parent_id">
              Under {{ store.categories.find((c) => c.id === category.parent_id)?.name }}
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                :id="`edit-category-${category.id}`"
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                @click="openEdit(category)"
              />
              <v-btn
                :id="`delete-category-${category.id}`"
                icon="mdi-trash-can-outline"
                variant="text"
                size="small"
                color="error"
                @click="deleteTarget = category"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-container>

    <v-dialog v-model="dialogOpen" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">
          {{ editingCategory ? 'Edit Category' : 'Add Category' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            id="category-name-input"
            v-model="form.name"
            label="Name"
            :error-messages="formErrors.name"
            autofocus
          />
          <v-select
            id="category-parent-select"
            v-model="form.parent_id"
            label="Parent category (optional)"
            :items="parentOptions(editingCategory?.id)"
            clearable
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancel</v-btn>
          <v-btn id="save-category-btn" color="primary" :loading="saving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="!!deleteTarget" max-width="420" @update:model-value="deleteTarget = null">
      <v-card class="pa-4">
        <v-card-title class="font-weight-bold">Delete category?</v-card-title>
        <v-card-text>
          "{{ deleteTarget?.name }}" will be removed. Products in it will become uncategorized.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteTarget = null">Cancel</v-btn>
          <v-btn id="confirm-delete-category-btn" color="error" :loading="deleting" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
