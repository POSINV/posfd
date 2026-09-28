import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/onboarding/OnboardingPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('@/views/products/CategoriesPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('@/views/products/ProductsListPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/products/new',
      name: 'product-new',
      component: () => import('@/views/products/ProductFormPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/products/:id/edit',
      name: 'product-edit',
      component: () => import('@/views/products/ProductFormPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
      props: true,
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('@/views/customers/CustomersPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/customers/:id',
      name: 'customer-detail',
      component: () => import('@/views/customers/CustomerDetailPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
      props: true,
    },
    {
      path: '/billing',
      name: 'billing',
      component: () => import('@/views/billing/BillingPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/invoices',
      name: 'invoices',
      component: () => import('@/views/billing/InvoicesListPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/invoices/:id',
      name: 'invoice-detail',
      component: () => import('@/views/billing/InvoiceDetailPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
      props: true,
    },
    {
      path: '/invoices/:id/print',
      name: 'invoice-print',
      component: () => import('@/views/billing/InvoicePrintPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
      props: true,
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/reports/ReportsPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/BusinessSettingsPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/imports',
      name: 'imports',
      component: () => import('@/views/imports/ImportPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/settings/audit-log',
      name: 'audit-log',
      component: () => import('@/views/settings/AuditLogPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/subscription',
      name: 'subscription',
      component: () => import('@/views/subscription/SubscriptionPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/whatsapp',
      name: 'whatsapp',
      component: () => import('@/views/whatsapp/WhatsappPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    {
      path: '/offers',
      name: 'offers',
      component: () => import('@/views/offers/OffersPage.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true, layout: 'app' },
    },
    // Platform-admin routes (Phase 2 §13/§45) - a completely separate
    // login/auth domain from the tenant app above, so they're guarded
    // below by useAdminStore(), never useAuthStore().
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLoginPage.vue'),
      meta: { adminGuestOnly: true },
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/AdminDashboardPage.vue'),
      meta: { requiresAdminAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.path.startsWith('/admin')) {
    const admin = useAdminStore()

    if (!admin.ready) {
      await admin.initialize()
    }

    if (to.meta.requiresAdminAuth && !admin.isAuthenticated) {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }

    if (to.meta.adminGuestOnly && admin.isAuthenticated) {
      return { name: 'admin-dashboard' }
    }

    return true
  }

  const auth = useAuthStore()

  if (!auth.ready) {
    await auth.initialize()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresOnboarding && auth.isAuthenticated && !auth.hasCompletedOnboarding) {
    return { name: 'onboarding' }
  }

  return true
})

export default router
