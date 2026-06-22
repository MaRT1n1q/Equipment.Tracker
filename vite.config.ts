import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import pkg from './package.json'

const __dirname = path.resolve()
const isWebOnlyMode = process.env.WEB_ONLY === '1' || process.env.WEB_ONLY === 'true'

/**
 * Убирает crossorigin атрибут из <script> и <link rel="modulepreload"> тегов.
 * В Electron (file://) crossorigin вызывает CORS-ошибки при загрузке чанков.
 * Для web (same-origin nginx) crossorigin не нужен.
 */
function removeCrossorigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '')
    },
  }
}

export default defineConfig({
  // Относительные пути — критично для Electron (file://) и работают для web (nginx root).
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Compile-time флаг: false в web-сборке → tree-shaking убирает Electron-код.
    // В desktop-сборке остаётся true, проверка выполняется в runtime.
    __IS_ELECTRON__: JSON.stringify(!isWebOnlyMode),
  },
  plugins: [
    react(),
    removeCrossorigin(),
    ...(!isWebOnlyMode
      ? [
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
        ]
      : []),
  ],
  build: {
    // modulePreload без crossorigin — иначе file:// в Electron падает с CORS-ошибкой
    modulePreload: { polyfill: true },
    // Разбиение только стабильных вендоров (не доменных модулей — иначе циклические
    // зависимости и "Cannot access 'X' before initialization"). Доменные модули
    // разбиваются через React.lazy() в App.tsx.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React и react-dom оставляем в дефолтном чанке — выделение отдельно
            // создаёт circular chunk с query-vendor (TanStack импортирует React).
            if (id.includes('@tanstack/react-query')) return 'query-vendor'
            if (id.includes('@dnd-kit')) return 'dnd-vendor'
            if (id.includes('@radix-ui')) return 'radix-vendor'
            if (id.includes('lucide-react')) return 'icons-vendor'
            if (id.includes('sonner') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui-utils-vendor'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
