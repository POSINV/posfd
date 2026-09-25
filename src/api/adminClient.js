import axios from 'axios'

// A completely separate axios instance from the tenant `client` (see
// Phase 2 §13/§45) - platform-admin tokens must never be sent on a
// tenant request or vice versa, so they can't leak across the boundary
// even by accident.
const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4002/api/v1',
})

export function setAdminAuthToken(token) {
  if (token) {
    adminClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete adminClient.defaults.headers.common.Authorization
  }
}

export default adminClient
