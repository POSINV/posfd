<script setup>
import { ref } from 'vue'
import { apiErrorMessage } from '@/api/client'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  columns: { type: Array, required: true }, // [{ key: 'name', label: 'Name' }]
  previewFn: { type: Function, required: true },
  commitFn: { type: Function, required: true },
  downloadTemplateFn: { type: Function, required: true },
  // What one committed unit is called in the result summary - a products
  // or opening-stock row creates one entity per row, but a historical
  // bills row is one line item of a possibly multi-line invoice.
  itemLabel: { type: String, default: 'Row' },
})
const emit = defineEmits(['imported'])

const file = ref(null)
const previewing = ref(false)
const committing = ref(false)
const downloadingTemplate = ref(false)
const errorMessage = ref('')

const preview = ref(null) // { total, valid, invalid, rows }
const commitResult = ref(null) // { created, failed_count, failed }

async function downloadTemplate() {
  downloadingTemplate.value = true
  try {
    await props.downloadTemplateFn()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    downloadingTemplate.value = false
  }
}

function onFileChange(files) {
  file.value = Array.isArray(files) ? files[0] : files
  preview.value = null
  commitResult.value = null
}

async function runPreview() {
  if (!file.value) return
  previewing.value = true
  errorMessage.value = ''
  commitResult.value = null
  try {
    preview.value = await props.previewFn(file.value)
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    previewing.value = false
  }
}

async function runCommit() {
  if (!preview.value) return
  committing.value = true
  errorMessage.value = ''
  try {
    const rows = preview.value.rows
      .filter((r) => r.valid)
      .map((r) => ({ ...r.fields, row_number: r.row_number }))

    commitResult.value = await props.commitFn(rows)
    preview.value = null
    file.value = null
    emit('imported')
  } catch (error) {
    errorMessage.value = apiErrorMessage(error)
  } finally {
    committing.value = false
  }
}

function startOver() {
  file.value = null
  preview.value = null
  commitResult.value = null
  errorMessage.value = ''
}

function errorSummary(errors) {
  return Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
    .join('; ')
}
</script>

<template>
  <v-card class="pa-6" border>
    <div class="text-subtitle-1 font-weight-bold mb-1">{{ title }}</div>
    <p class="text-body-2 text-medium-emphasis mb-4">{{ description }}</p>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <!-- Step 1: pick a file -->
    <template v-if="!preview && !commitResult">
      <v-btn variant="text" size="small" prepend-icon="mdi-download-outline" :loading="downloadingTemplate" class="mb-3" @click="downloadTemplate">
        Download CSV Template
      </v-btn>

      <v-file-input
        v-model="file"
        label="Choose a CSV file"
        accept=".csv,text/csv"
        prepend-icon="mdi-file-upload-outline"
        show-size
        density="comfortable"
        class="mb-2"
        @update:model-value="onFileChange"
      />

      <v-btn color="primary" :disabled="!file" :loading="previewing" prepend-icon="mdi-eye-outline" @click="runPreview">
        Preview Import
      </v-btn>
    </template>

    <!-- Step 2: review the preview, then commit -->
    <template v-else-if="preview">
      <div class="d-flex ga-4 mb-4 flex-wrap">
        <v-chip color="default" variant="tonal">{{ preview.total }} rows</v-chip>
        <v-chip color="success" variant="tonal">{{ preview.valid }} valid</v-chip>
        <v-chip v-if="preview.invalid > 0" color="error" variant="tonal">{{ preview.invalid }} need fixing</v-chip>
      </div>

      <v-table density="comfortable" class="mb-4" style="max-height: 360px; overflow-y: auto">
        <thead>
          <tr>
            <th>Row</th>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in preview.rows" :key="row.row_number" :class="{ 'row-invalid': !row.valid }">
            <td>{{ row.row_number }}</td>
            <td v-for="col in columns" :key="col.key">{{ row.fields[col.key] || '—' }}</td>
            <td>
              <v-chip v-if="row.valid" size="small" color="success" variant="tonal">OK</v-chip>
              <v-tooltip v-else :text="errorSummary(row.errors)">
                <template #activator="{ props: tooltipProps }">
                  <v-chip v-bind="tooltipProps" size="small" color="error" variant="tonal">
                    {{ Object.keys(row.errors).length }} error(s)
                  </v-chip>
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div class="d-flex ga-2">
        <v-btn variant="text" @click="startOver">Start Over</v-btn>
        <v-btn
          color="primary"
          :disabled="preview.valid === 0"
          :loading="committing"
          prepend-icon="mdi-check"
          @click="runCommit"
        >
          Import {{ preview.valid }} Valid {{ itemLabel }}{{ preview.valid === 1 ? '' : 's' }}
        </v-btn>
      </div>
    </template>

    <!-- Step 3: result -->
    <template v-else-if="commitResult">
      <v-alert type="success" variant="tonal" class="mb-4">
        Imported {{ commitResult.created }} {{ itemLabel.toLowerCase() }}{{ commitResult.created === 1 ? '' : 's' }} successfully.
      </v-alert>

      <template v-if="commitResult.failed_count > 0">
        <div class="text-body-2 font-weight-medium mb-2">
          {{ commitResult.failed_count }} {{ itemLabel.toLowerCase() }}{{ commitResult.failed_count === 1 ? '' : 's' }} could not be imported:
        </div>
        <div v-for="f in commitResult.failed" :key="f.row_number" class="text-body-2 text-error mb-1">
          Row {{ f.row_number }}: {{ errorSummary(f.errors) }}
        </div>
      </template>

      <v-btn color="primary" class="mt-4" @click="startOver">Import Another File</v-btn>
    </template>
  </v-card>
</template>

<style scoped>
.row-invalid {
  background: rgba(var(--v-theme-error), 0.05);
}
</style>
