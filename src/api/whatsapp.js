import client from '@/api/client'

export const WhatsappApi = {
  listTemplates: () => client.get('/whatsapp/templates').then((r) => r.data.data),
  getTemplate: (id) => client.get(`/whatsapp/templates/${id}`).then((r) => r.data.data),
  createTemplate: (attrs) =>
    client.post('/whatsapp/templates', { template: attrs }).then((r) => r.data.data),
  updateTemplate: (id, attrs) =>
    client.patch(`/whatsapp/templates/${id}`, { template: attrs }).then((r) => r.data.data),

  listCampaigns: () => client.get('/whatsapp/campaigns').then((r) => r.data.data),
  getCampaign: (id) => client.get(`/whatsapp/campaigns/${id}`).then((r) => r.data.data),
  createCampaign: (attrs) =>
    client.post('/whatsapp/campaigns', { campaign: attrs }).then((r) => r.data.data),
  cancelCampaign: (id) => client.post(`/whatsapp/campaigns/${id}/cancel`).then((r) => r.data.data),

  listMessages: (params) => client.get('/whatsapp/messages', { params }).then((r) => r.data),
}
