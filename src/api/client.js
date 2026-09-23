import axios from 'axios'

// Every request against the backend goes through this single instance so
// auth/tenant headers stay consistent across the app. Do not call axios
// directly from stores/components.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4002/api/v1',
})

export function setAuthToken(token) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete client.defaults.headers.common.Authorization
  }
}

export function setCurrentBusinessId(businessId) {
  if (businessId) {
    client.defaults.headers.common['x-business-id'] = businessId
  } else {
    delete client.defaults.headers.common['x-business-id']
  }
}

/** Flattens Phoenix's `%{errors: %{field: ["msg"]}}` / `%{error: %{message}}` shapes into one string. */
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  if (!data) return fallback
  if (data.error?.message) return data.error.message
  if (data.errors) {
    return Object.entries(data.errors)
      .map(([field, messages]) => `${field} ${messages.join(', ')}`)
      .join('; ')
  }
  return fallback
}

export default client
