import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { checker } from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/core',
        {
          'pinia': ['storeToRefs']
        }
      ],
      dts: true,
      dirs: [
        './src/composables/**',
        './src/stores/**'
      ],
      vueTemplate: true,
    }),
    Components({
      dts: true,
      dirs: ['./src/components'],
    }),
    checker({
      vueTsc: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('naive-ui') || id.includes('vueuc') || id.includes('vooks') || id.includes('evtd') || id.includes('css-render') || id.includes('@css-render') || id.includes('seemly')) {
              return 'naive-vendor'
            }

            if (id.includes('vue-i18n') || id.includes('@intlify')) {
              return 'i18n-vendor'
            }

            if (id.includes('jszip')) {
              return 'zip-vendor'
            }

            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vue-vendor'
            }

            if (id.includes('@headlessui') || id.includes('@heroicons')) {
              return 'ui-vendor'
            }
          }

          return undefined
        },
      },
    },
  },
})
