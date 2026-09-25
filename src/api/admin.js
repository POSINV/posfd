import adminClient from '@/api/adminClient'

export const AdminApi = {
  login: (email, password) =>
    adminClient.post('/admin/login', { email, password }).then((r) => r.data.data),
  logout: () => adminClient.delete('/admin/logout'),
  me: () => adminClient.get('/admin/me').then((r) => r.data.data),

  dashboard: () => adminClient.get('/admin/dashboard').then((r) => r.data.data),
  businesses: (status) =>
    adminClient.get('/admin/businesses', { params: { status } }).then((r) => r.data.data),

  plans: () => adminClient.get('/admin/plans').then((r) => r.data.data),
  createPlan: (plan) => adminClient.post('/admin/plans', { plan }).then((r) => r.data.data),
  updatePlan: (id, plan) => adminClient.patch(`/admin/plans/${id}`, { plan }).then((r) => r.data.data),

  activatePlan: (businessId, payload) =>
    adminClient
      .post(`/admin/businesses/${businessId}/activate_plan`, payload)
      .then((r) => r.data.data),
  cancelSubscription: (businessId) =>
    adminClient.post(`/admin/businesses/${businessId}/cancel_subscription`).then((r) => r.data.data),

  whatsappTemplates: (status) =>
    adminClient.get('/admin/whatsapp/templates', { params: { status } }).then((r) => r.data.data),
  approveWhatsappTemplate: (id, providerTemplateName) =>
    adminClient
      .post(`/admin/whatsapp/templates/${id}/approve`, { provider_template_name: providerTemplateName })
      .then((r) => r.data.data),
  rejectWhatsappTemplate: (id, reason) =>
    adminClient.post(`/admin/whatsapp/templates/${id}/reject`, { reason }).then((r) => r.data.data),
}
