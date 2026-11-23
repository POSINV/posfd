<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'
import { useAppConfigStore } from '@/stores/appConfig'
import { useUiTheme } from '@/stores/uiTheme'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher.vue'
import TrialBanner from '@/components/subscription/TrialBanner.vue'
import CommandPalette from '@/components/layout/CommandPalette.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const subscription = useSubscriptionStore()
const appConfig = useAppConfigStore()
const uiTheme = useUiTheme()
const { mobile } = useDisplay()

// Order matters: the first four are the phone bottom-nav shortcuts.
const navItems = computed(() => [
  { key: 'dashboard', group: 'workspace', title: t('nav.dashboard'), icon: 'mdi-view-dashboard-outline', to: { name: 'dashboard' } },
  { key: 'billing', group: 'workspace', title: t('nav.billing'), icon: 'mdi-point-of-sale', to: { name: 'billing' } },
  { key: 'invoices', group: 'workspace', title: t('nav.invoices'), icon: 'mdi-receipt-text-outline', to: { name: 'invoices' } },
  { key: 'products', group: 'catalog', title: t('nav.products'), icon: 'mdi-tag-outline', to: { name: 'products' } },
  { key: 'categories', group: 'catalog', title: t('nav.categories'), icon: 'mdi-shape-outline', to: { name: 'categories' } },
  { key: 'customers', group: 'catalog', title: t('nav.customers'), icon: 'mdi-account-outline', to: { name: 'customers' } },
  { key: 'reports', group: 'insights', title: t('nav.reports'), icon: 'mdi-chart-line', to: { name: 'reports' } },
  { key: 'imports', group: 'catalog', title: t('nav.bulkImport'), icon: 'mdi-file-upload-outline', to: { name: 'imports' } },
  { key: 'subscription', group: 'account', title: t('nav.subscription'), icon: 'mdi-credit-card-outline', to: { name: 'subscription' } },
  { key: 'whatsapp', group: 'growth', title: t('nav.whatsapp'), icon: 'mdi-whatsapp', to: { name: 'whatsapp' } },
  { key: 'offers', group: 'growth', title: t('nav.offers'), icon: 'mdi-sale', to: { name: 'offers' } },
])

const groupOrder = ['workspace', 'catalog', 'insights', 'growth', 'account']

const navGroups = computed(() =>
  groupOrder
    .map((g) => ({ key: g, title: t(`shell.groups.${g}`), items: navItems.value.filter((i) => i.group === g) }))
    .filter((g) => g.items.length),
)

const paletteItems = computed(() => [
  ...navItems.value.map((i) => ({ ...i, group: t('shell.goTo') })),
  { key: 'settings', group: t('shell.goTo'), title: t('nav.businessSettings'), icon: 'mdi-cog-outline', to: { name: 'settings' } },
  { key: 'new-sale', group: t('shell.actions'), title: t('billing.newSale'), icon: 'mdi-plus-circle-outline', to: { name: 'billing' } },
  { key: 'new-product', group: t('shell.actions'), title: t('dashboard.addProduct'), icon: 'mdi-plus', to: { name: 'product-new' } },
  {
    key: 'toggle-theme',
    group: t('shell.actions'),
    title: uiTheme.isDark.value ? t('shell.lightMode') : t('shell.darkMode'),
    icon: uiTheme.isDark.value ? 'mdi-weather-sunny' : 'mdi-weather-night',
    action: uiTheme.toggle,
  },
  { key: 'logout', group: t('shell.actions'), title: t('auth.logout'), icon: 'mdi-logout', action: logout },
])

onMounted(() => {
  subscription.refresh()
  appConfig.load()
})
watch(() => auth.currentBusinessId, () => subscription.refresh())

// The four most-used destinations on a phone, plus a "More" sheet for
// everything else - a shop owner billing from their phone shouldn't have
// to hunt through a drawer for the one button they need most (§17).
const bottomNavItems = computed(() => navItems.value.slice(0, 4))
const moreNavItems = computed(() => navItems.value.slice(4))

// On desktop the drawer is permanent and must start (and stay) open; on a
// phone it is a temporary overlay that starts closed. Keep the v-model in
// sync with the breakpoint so a production build (where `mobile` is
// already correct on first render) doesn't leave the desktop sidebar hidden.
const drawerOpen = ref(!mobile.value)
watch(mobile, (isMobile) => {
  drawerOpen.value = !isMobile
})

function closeDrawerOnMobile() {
  if (mobile.value) drawerOpen.value = false
}
const moreSheetOpen = ref(false)
const paletteOpen = ref(false)

const activeName = computed(() => route.name)

// Highlights the parent section on detail pages too (e.g. product-edit → Products).
function isActive(item) {
  const name = String(activeName.value || '')
  const base = item.to.name
  return name === base || name.startsWith(`${base.replace(/(ies|s)$/, '')}-`)
}

const currentSection = computed(() => navItems.value.find(isActive) || null)

const businessName = computed(() => auth.currentBusiness?.name || t('app.name'))
const userInitial = computed(() => (auth.user?.full_name || '?').charAt(0).toUpperCase())
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')

function go(to) {
  router.push(to)
  closeDrawerOnMobile()
  moreSheetOpen.value = false
}

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <v-navigation-drawer
    v-model="drawerOpen"
    :permanent="!mobile"
    :temporary="mobile"
    color="sidebar"
    border="e"
    width="252"
    class="app-sidebar"
  >
    <div class="sidebar-inner">
      <div class="workspace">
        <div class="workspace-logo">{{ businessName.charAt(0).toUpperCase() }}</div>
        <div class="workspace-name text-truncate">{{ businessName }}</div>
      </div>

      <button id="command-palette-trigger" type="button" class="search-trigger" @click="paletteOpen = true">
        <v-icon icon="mdi-magnify" size="16" />
        <span class="flex-grow-1 text-left">{{ t('shell.search') }}</span>
        <span class="kbd-group"><kbd class="kbd">{{ isMac ? '⌘' : 'Ctrl' }}</kbd><kbd class="kbd">K</kbd></span>
      </button>

      <nav class="nav-scroll">
        <div v-for="group in navGroups" :key="group.key" class="nav-group">
          <div class="nav-group-title">{{ group.title }}</div>
          <RouterLink
            v-for="item in group.items"
            :key="item.key"
            :to="item.to"
            class="nav-link"
            :class="{ 'is-active': isActive(item) }"
            @click="closeDrawerOnMobile"
          >
            <v-icon :icon="item.icon" size="18" class="nav-link-icon" />
            <span class="text-truncate">{{ item.title }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">
        <RouterLink :to="{ name: 'settings' }" class="nav-link" :class="{ 'is-active': activeName === 'settings' }">
          <v-icon icon="mdi-cog-outline" size="18" class="nav-link-icon" />
          <span class="text-truncate">{{ t('nav.businessSettings') }}</span>
        </RouterLink>
        <button id="theme-toggle" type="button" class="nav-link" @click="uiTheme.toggle()">
          <v-icon :icon="uiTheme.isDark.value ? 'mdi-weather-sunny' : 'mdi-weather-night'" size="18" class="nav-link-icon" />
          <span class="text-truncate">{{ uiTheme.isDark.value ? t('shell.lightMode') : t('shell.darkMode') }}</span>
        </button>
      </div>
    </div>
  </v-navigation-drawer>

  <v-app-bar flat border="b" color="background" height="56" class="app-topbar">
    <v-app-bar-nav-icon v-if="mobile" id="mobile-nav-toggle" size="small" @click="drawerOpen = !drawerOpen" />

    <div class="topbar-title d-flex align-center ga-2 text-truncate" :class="mobile ? 'ml-1' : 'ml-6'">
      <template v-if="mobile">
        <span class="font-weight-bold text-truncate">{{ currentSection?.title || businessName }}</span>
      </template>
      <template v-else>
        <span class="text-medium-emphasis text-truncate">{{ businessName }}</span>
        <template v-if="currentSection">
          <v-icon icon="mdi-chevron-right" size="16" class="text-disabled" />
          <v-icon :icon="currentSection.icon" size="16" class="text-medium-emphasis" />
          <span class="font-weight-medium text-truncate">{{ currentSection.title }}</span>
        </template>
      </template>
    </div>

    <v-spacer />

    <v-chip
      v-if="appConfig.appEnv && appConfig.appEnv !== 'production'"
      id="app-env-badge"
      :color="appConfig.isLocal ? 'warning' : 'info'"
      variant="tonal"
      size="small"
      label
      class="mr-2 font-weight-bold"
    >
      {{ t(`integrations.envBadge.${appConfig.appEnv}`, appConfig.appEnv) }}
    </v-chip>

    <v-btn v-if="mobile" icon="mdi-magnify" variant="text" size="small" @click="paletteOpen = true" />

    <LanguageSwitcher :compact="mobile" class="mr-1" />

    <v-menu location="bottom end" offset="6">
      <template #activator="{ props }">
        <v-btn id="user-menu-activator" v-bind="props" variant="text" :icon="mobile" class="user-btn" :class="{ 'mr-3': !mobile }">
          <span class="user-avatar">{{ userInitial }}</span>
          <template v-if="!mobile">
            <span class="ml-2 text-truncate" style="max-width: 160px">{{ auth.user?.full_name }}</span>
            <v-icon icon="mdi-chevron-down" size="16" end />
          </template>
        </v-btn>
      </template>
      <v-card min-width="220" class="py-1 menu-card" border>
        <div class="px-4 pt-2 pb-2">
          <div class="text-body-2 font-weight-medium text-truncate">{{ auth.user?.full_name }}</div>
          <div class="text-caption text-medium-emphasis text-truncate">{{ auth.user?.email }}</div>
        </div>
        <v-divider />
        <v-list density="compact" class="py-1">
          <v-list-item id="settings-action" :to="{ name: 'settings' }" prepend-icon="mdi-cog-outline">
            <v-list-item-title>{{ t('nav.businessSettings') }}</v-list-item-title>
          </v-list-item>
          <v-list-item :prepend-icon="uiTheme.isDark.value ? 'mdi-weather-sunny' : 'mdi-weather-night'" @click="uiTheme.toggle()">
            <v-list-item-title>{{ uiTheme.isDark.value ? t('shell.lightMode') : t('shell.darkMode') }}</v-list-item-title>
          </v-list-item>
          <v-list-item id="logout-action" prepend-icon="mdi-logout" @click="logout">
            <v-list-item-title>{{ t('auth.logout') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-main class="app-main" :class="{ 'pb-16': mobile }">
    <TrialBanner />
    <slot />
  </v-main>

  <CommandPalette v-model="paletteOpen" :items="paletteItems" />

  <v-bottom-navigation v-if="mobile" grow color="primary" bg-color="surface" elevation="0" border="t" class="bottom-nav">
    <v-btn
      v-for="item in bottomNavItems"
      :key="item.key"
      :value="item.key"
      :active="isActive(item)"
      @click="go(item.to)"
    >
      <v-icon :icon="item.icon" />
      <span class="text-caption">{{ item.title }}</span>
    </v-btn>
    <v-btn value="more" @click="moreSheetOpen = true">
      <v-icon icon="mdi-dots-horizontal" />
      <span class="text-caption">{{ t('nav.more') }}</span>
    </v-btn>
  </v-bottom-navigation>

  <v-bottom-sheet v-model="moreSheetOpen">
    <v-card class="more-sheet pt-2 pb-4">
      <div class="sheet-handle" />
      <v-list>
        <v-list-item
          v-for="item in moreNavItems"
          :key="item.key"
          :prepend-icon="item.icon"
          :title="item.title"
          @click="go(item.to)"
        />
        <v-divider class="my-2" />
        <v-list-item prepend-icon="mdi-cog-outline" :title="t('nav.businessSettings')" @click="go({ name: 'settings' })" />
      </v-list>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 10px;
}

.workspace {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 12px;
}

.workspace-logo {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 7px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-accent)));
}

.workspace-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 8px 0 10px;
  margin-bottom: 14px;
  border-radius: 8px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), 0.1);
  transition: border-color 0.15s var(--ease-standard), color 0.15s var(--ease-standard);
}

.search-trigger:hover {
  border-color: rgba(var(--v-border-color), 0.2);
  color: rgb(var(--v-theme-on-surface));
}

.kbd-group {
  display: inline-flex;
  gap: 2px;
}

.nav-scroll {
  flex: 1;
  overflow-y: auto;
  margin: 0 -2px;
  padding: 0 2px;
}

.nav-group + .nav-group {
  margin-top: 16px;
}

.nav-group-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.42);
  padding: 0 10px 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.72);
  text-decoration: none;
  transition: background-color 0.12s var(--ease-standard), color 0.12s var(--ease-standard);
}

.nav-link + .nav-link {
  margin-top: 1px;
}

.nav-link:hover {
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
}

.nav-link.is-active {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
}

.nav-link-icon {
  opacity: 0.75;
}

.nav-link.is-active .nav-link-icon {
  color: rgb(var(--v-theme-primary));
  opacity: 1;
}

.sidebar-footer {
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.app-topbar {
  backdrop-filter: saturate(180%) blur(12px);
  background: rgba(var(--v-theme-background), 0.82) !important;
}

.topbar-title {
  font-size: 13.5px;
  min-width: 0;
}

.user-btn {
  padding: 0 8px !important;
}

.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary-lighten-1));
}

.menu-card {
  box-shadow: var(--shadow-lifted) !important;
}

.app-main {
  background: rgb(var(--v-theme-background));
}

.bottom-nav :deep(.v-btn--active) {
  font-weight: 600;
}

.more-sheet {
  border-radius: 20px 20px 0 0 !important;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  margin: 4px auto 8px;
  background: rgba(var(--v-theme-on-surface), 0.18);
}
</style>
