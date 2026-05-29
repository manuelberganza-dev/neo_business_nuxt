import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@vueuse/nuxt', 'shadcn-nuxt'],
  css: ['~/assets/css/tailwind.css'],
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
