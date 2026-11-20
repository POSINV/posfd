import client from '@/api/client'

export const AppConfigApi = {
  get: () => client.get('/app_config').then((r) => r.data.data),
}
