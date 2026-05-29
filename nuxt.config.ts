import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@vueuse/nuxt', 'shadcn-nuxt'],
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    apiBase: process.env.NUXT_API_BASE ?? process.env.NUXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:3000/api/v1',
  },
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
