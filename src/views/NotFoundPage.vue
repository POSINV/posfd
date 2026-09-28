<template>
  <v-main>
    <v-container class="fill-height">
      <div class="text-center w-100">
        <div class="text-h3 font-weight-bold text-primary">404</div>
        <p class="text-body-1 text-medium-emphasis mb-4">{{ $t('notFound.pageNotFound') }}</p>
        <v-btn color="primary" :to="{ name: 'dashboard' }">{{ $t('notFound.goHome') }}</v-btn>
      </div>
    </v-container>
  </v-main>
</template>
