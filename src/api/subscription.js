import client from '@/api/client'

export const SubscriptionApi = {
  publicPlans: () => client.get('/subscription_plans').then((r) => r.data.data),
  status: () => client.get('/subscription').then((r) => r.data.data),
  payments: () => client.get('/subscription/payments').then((r) => r.data.data),
  createCheckout: (planId) =>
    client.post('/subscription/checkout', { plan_id: planId }).then((r) => r.data.data),
  verifyCheckout: (payload) =>
    client.post('/subscription/checkout/verify', payload).then((r) => r.data.data),
}
