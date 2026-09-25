<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher.vue'
import TrialBanner from '@/components/subscription/TrialBanner.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const subscription = useSubscriptionStore()
const { mobile } = useDisplay()

const navItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: { name: 'dashboard' } },
  { title: 'Billing', icon: 'mdi-point-of-sale', to: { name: 'billing' } },
  { title: 'Invoices', icon: 'mdi-receipt-text-outline', to: { name: 'invoices' } },
  { title: 'Products', icon: 'mdi-tag-outline', to: { name: 'products' } },
  { title: 'Categories', icon: 'mdi-shape-outline', to: { name: 'categories' } },
  { title: 'Customers', icon: 'mdi-account-outline', to: { name: 'customers' } },
  { title: 'Reports', icon: 'mdi-chart-line', to: { name: 'reports' } },
  { title: 'Bulk Import', icon: 'mdi-file-upload-outline', to: { name: 'imports' } },
  { title: 'Subscription', icon: 'mdi-credit-card-outline', to: { name: 'subscription' } },
]

onMounted(() => subscription.refresh())
watch(() => auth.currentBusinessId, () => subscription.refresh())

// The four most-used destinations on a phone, plus a "More" sheet for
// everything else - a shop owner billing from their phone shouldn't have
// to hunt through a drawer for the one button they need most (§17).
const bottomNavItems = navItems.slice(0, 4)

const drawerOpen = ref(false)
const moreSheetOpen = ref(false)

const activeName = computed(() => route.name)

function go(to) {
  router.push(to)
  drawerOpen.value = false
  moreSheetOpen.value = false
}

async function logout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <v-app-bar flat border color="surface">
    <v-app-bar-nav-icon v-if="mobile" id="mobile-nav-toggle" @click="drawerOpen = !drawerOpen" />

    <v-app-bar-title class="d-flex align-center">
      <v-avatar color="primary" size="32" rounded="lg" class="mr-3">
        <v-icon icon="mdi-storefront-outline" color="white" size="20" />
      </v-avatar>
      <span class="font-weight-bold text-truncate">{{ auth.currentBusiness?.name || t('app.name') }}</span>
    </v-app-bar-title>

    <v-spacer />

    <LanguageSwitcher :compact="mobile" class="mr-1" />

    <v-menu>
      <template #activator="{ props }">
        <v-btn id="user-menu-activator" v-bind="props" variant="text" :icon="mobile">
          <v-avatar v-if="mobile" color="primary-lighten-1" size="32">
            <span class="text-primary text-caption font-weight-bold">
              {{ (auth.user?.full_name || '?').charAt(0).toUpperCase() }}
            </span>
          </v-avatar>
          <template v-else>
            {{ auth.user?.full_name }}
            <v-icon icon="mdi-chevron-down" end />
          </template>
        </v-btn>
      </template>
      <v-list>
        <v-list-item id="settings-action" :to="{ name: 'settings' }">
          <v-list-item-title>Business Settings</v-list-item-title>
        </v-list-item>
        <v-list-item id="logout-action" @click="logout">
          <v-list-item-title>{{ t('auth.logout') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawerOpen"
    :permanent="!mobile"
    :temporary="mobile"
    color="surface"
    border
    width="248"
  >
    <v-list nav density="comfortable" class="pa-3">
      <v-list-item
        v-for="item in navItems"
        :key="item.title"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        rounded="lg"
        class="mb-1 nav-item"
        :active="activeName === item.to.name"
      />
    </v-list>
  </v-navigation-drawer>

  <v-main :class="{ 'pb-16': mobile }">
    <TrialBanner />
    <slot />
  </v-main>

  <v-bottom-navigation v-if="mobile" grow color="primary" bg-color="surface" elevation="8" class="bottom-nav">
    <v-btn
      v-for="item in bottomNavItems"
      :key="item.title"
      :value="item.title"
      :active="activeName === item.to.name"
      @click="go(item.to)"
    >
      <v-icon :icon="item.icon" />
      <span class="text-caption">{{ item.title }}</span>
    </v-btn>
    <v-btn value="more" @click="moreSheetOpen = true">
      <v-icon icon="mdi-dots-horizontal" />
      <span class="text-caption">More</span>
    </v-btn>
  </v-bottom-navigation>

  <v-bottom-sheet v-model="moreSheetOpen">
    <v-list class="pt-2 pb-4">
      <v-list-item
        v-for="item in navItems.slice(4)"
        :key="item.title"
        :prepend-icon="item.icon"
        :title="item.title"
        @click="go(item.to)"
      />
      <v-divider class="my-2" />
      <v-list-item prepend-icon="mdi-cog-outline" title="Business Settings" @click="go({ name: 'settings' })" />
    </v-list>
  </v-bottom-sheet>
</template>

<style scoped>
.nav-item.v-list-item--active {
  background: rgb(var(--v-theme-primary-lighten-1));
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.bottom-nav :deep(.v-btn--active) {
  font-weight: 600;
}
</style>
