export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2025-08-17',
  css: ['~/assets/styles.css'],
  app: {
    head: {
      title: 'DnDGem Nuxt Compat',
    },
  },
  build: {
    transpile: ['@dndgem/vue', '@dndgem/dom', '@dndgem/core'],
  },
  nitro: {
    preset: 'node-server',
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
});
