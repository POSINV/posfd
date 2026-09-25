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

// The backend blocks tenant-scoped requests with 402 once a business's
// trial/subscription is no longer entitled (Phase 2 §8/§9) - this is the
// enforcement, not just a UX nicety. Route any such response straight to
// the Subscription page so the owner always lands somewhere that
// explains why and lets them fix it. Router is imported lazily to avoid
// a load-order cycle with this module.
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 402) {
      const { default: router } = await import('@/router')
      if (router.currentRoute.value.name !== 'subscription') {
        router.push({ name: 'subscription' })
      }
    }
    return Promise.reject(error)
  },
)

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
