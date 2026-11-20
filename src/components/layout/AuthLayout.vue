<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})

const { t } = useI18n()

// Pinterest-style masonry of "pins" showing what the product does. Pure
// CSS/icons - no remote images, so it loads instantly on slow connections.
const columns = computed(() => [
  [
    { icon: 'mdi-point-of-sale', label: t('nav.billing'), tone: 'indigo', h: 220 },
    { icon: 'mdi-whatsapp', label: t('nav.whatsapp'), tone: 'green', h: 150 },
    { icon: 'mdi-shape-outline', label: t('nav.categories'), tone: 'amber', h: 190 },
  ],
  [
    { icon: 'mdi-chart-line', label: t('nav.reports'), tone: 'rose', h: 160 },
    { icon: 'mdi-tag-outline', label: t('nav.products'), tone: 'sky', h: 240 },
    { icon: 'mdi-sale', label: t('nav.offers'), tone: 'violet', h: 150 },
  ],
  [
    { icon: 'mdi-account-heart-outline', label: t('nav.customers'), tone: 'teal', h: 200 },
    { icon: 'mdi-receipt-text-outline', label: t('nav.invoices'), tone: 'orange', h: 170 },
    { icon: 'mdi-file-upload-outline', label: t('nav.bulkImport'), tone: 'indigo', h: 210 },
  ],
])
</script>

<template>
  <v-main class="auth-layout">
    <div class="auth-grid">
      <section class="auth-form-side">
        <header class="auth-header">
          <div class="brand">
            <div class="brand-logo"><v-icon icon="mdi-storefront-outline" color="white" size="18" /></div>
            <span class="brand-name">{{ t('app.name') }}</span>
          </div>
          <LanguageSwitcher />
        </header>

        <div class="auth-form-wrap">
          <h1 class="auth-title">{{ title }}</h1>
          <p v-if="subtitle" class="auth-subtitle">{{ subtitle }}</p>
          <div class="auth-card">
            <slot />
          </div>
        </div>

        <footer class="auth-footer">© {{ new Date().getFullYear() }} {{ t('app.name') }}</footer>
      </section>

      <aside class="auth-showcase" aria-hidden="true">
        <div class="masonry">
          <div v-for="(col, ci) in columns" :key="ci" class="masonry-col" :class="`col-${ci}`">
            <div class="masonry-track">
              <div
                v-for="(pin, pi) in [...col, ...col]"
                :key="pi"
                class="pin"
                :class="`tone-${pin.tone}`"
                :style="{ height: `${pin.h}px` }"
              >
                <v-icon :icon="pin.icon" size="34" class="pin-icon" />
                <span class="pin-label">{{ pin.label }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="showcase-fade" />
        <div class="showcase-copy">
          <div class="showcase-title">{{ t('shell.heroTitle') }}</div>
          <div class="showcase-sub">{{ t('shell.heroSubtitle') }}</div>
        </div>
      </aside>
    </div>
  </v-main>
</template>

<style scoped>
.auth-layout {
  background: rgb(var(--v-theme-surface));
  min-height: 100vh;
}

.auth-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  min-height: 100vh;
}

.auth-form-side {
  display: flex;
  flex-direction: column;
  padding: 24px 32px;
}

.auth-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-accent)));
}

.brand-name {
  font-weight: 700;
  letter-spacing: -0.01em;
}

.auth-form-wrap {
  flex: 1;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 0;
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.auth-subtitle {
  margin-top: 8px;
  font-size: 15px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.auth-card {
  margin-top: 32px;
}

.auth-card :deep(.v-btn--size-large) {
  height: 48px;
  border-radius: 999px !important;
  font-weight: 600;
}

.auth-footer {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

/* ---- Showcase ---- */
.auth-showcase {
  position: relative;
  overflow: hidden;
  margin: 12px;
  border-radius: 24px;
  background: rgb(var(--v-theme-background));
}

.masonry {
  position: absolute;
  inset: -40px 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  transform: rotate(-6deg) scale(1.12);
}

.masonry-track {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: drift 38s linear infinite;
}

.col-1 .masonry-track {
  animation-duration: 46s;
  animation-direction: reverse;
}

.col-2 .masonry-track {
  animation-duration: 42s;
}

@keyframes drift {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

.pin {
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.pin-icon {
  opacity: 0.95;
}

.pin-label {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.tone-indigo { background: linear-gradient(160deg, #6E78E6, #4C56B8); }
.tone-green { background: linear-gradient(160deg, #34D399, #059669); }
.tone-amber { background: linear-gradient(160deg, #FBBF24, #D97706); }
.tone-rose { background: linear-gradient(160deg, #FB7185, #E60023); }
.tone-sky { background: linear-gradient(160deg, #38BDF8, #0369A1); }
.tone-violet { background: linear-gradient(160deg, #A78BFA, #6D28D9); }
.tone-teal { background: linear-gradient(160deg, #2DD4BF, #0F766E); }
.tone-orange { background: linear-gradient(160deg, #FDBA74, #EA580C); }

.showcase-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 10, 14, 0.78) 0%, rgba(10, 10, 14, 0.15) 45%, rgba(10, 10, 14, 0) 70%);
}

.showcase-copy {
  position: absolute;
  left: 40px;
  right: 40px;
  bottom: 40px;
  color: #fff;
}

.showcase-title {
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  max-width: 420px;
}

.showcase-sub {
  margin-top: 10px;
  font-size: 15px;
  opacity: 0.8;
  max-width: 420px;
}

@media (max-width: 959px) {
  .auth-grid {
    grid-template-columns: 1fr;
  }

  .auth-showcase {
    display: none;
  }

  .auth-form-side {
    padding: 16px 20px;
  }

  .auth-title {
    font-size: 1.6rem;
  }
}
</style>
