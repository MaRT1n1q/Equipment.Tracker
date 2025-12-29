import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'

const __dirname = path.resolve()

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options: { startup: () => void }) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            rollupOptions: {
              external: [
                'knex',
                'sqlite3',
                'tedious',
                'pg',
                'pg-query-stream',
                'mysql',
                'mysql2',
                'oracledb',
                'mssql',
              ],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options: { reload: () => void }) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            sourcemap: true,
            target: 'node20',
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'],
              fileName: () => 'preload.js',
            },
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Выносим node_modules в отдельные чанки
          if (id.includes('node_modules')) {
            // React и связанные библиотеки
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            // DnD Kit
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd'
            }
            // TanStack Query
            if (id.includes('@tanstack')) {
              return 'vendor-query'
            }
            // Radix UI
            if (id.includes('@radix-ui')) {
              return 'vendor-radix'
            }
            // Lucide icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            // Остальные зависимости
            return 'vendor'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
