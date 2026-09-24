import client from '@/api/client'

export const AuditLogsApi = {
  list: (params = {}) => client.get('/audit_logs', { params }).then((r) => r.data),
}
