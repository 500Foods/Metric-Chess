import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFileSync } from 'fs';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true,
    headers: {
      // Enable SharedArrayBuffer for Stockfish WebAssembly threading
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  preview: {
    port: 3000,
    headers: {
      // Enable SharedArrayBuffer for Stockfish WebAssembly threading
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  plugins: [
    VitePWA({
      manifest: {
        name: 'Metric Chess',
        short_name: 'MetricChess',
        description: 'A 10x10 chess variant with unique pieces including trebuchets and heir kings',
        theme_color: '#f0d9b5',
        background_color: '#2b2b2b',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'icons/chess-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globDirectory: 'public/',
        globPatterns: ['**/*.{js,css,html,svg,json,woff2,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/unpkg\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-cdn-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:wasm|js)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'stockfish-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      includeAssets: ['icons/chess-icon.svg', 'metric-chess.json', '**/*.wasm', '**/*.js'],
      copyAssets: true,
      selfDestroying: false
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      },
      plugins: [
        {
          name: 'copy-metric-chess-json',
          writeBundle() {
            const sourcePath = resolve(__dirname, 'metric-chess.json');
            const destPath = resolve(__dirname, 'dist', 'metric-chess.json');
            copyFileSync(sourcePath, destPath);
            console.log('Copied metric-chess.json to dist directory');
          }
        },
        {
          name: 'copy-stockfish-files',
          writeBundle() {
            // Create stockfish directory in dist
            const stockfishDir = resolve(__dirname, 'dist', 'js', 'stockfish');
            if (!fs.existsSync(stockfishDir)) {
              fs.mkdirSync(stockfishDir, { recursive: true });
            }
            
            // Copy all stockfish files
            const files = ['ffish.js', 'ffish.wasm', 'stockfish.js', 'stockfish.wasm', 'stockfish.worker.js'];
            files.forEach(file => {
              const sourcePath = resolve(__dirname, 'js', 'stockfish', file);
              const destPath = resolve(__dirname, 'dist', 'js', 'stockfish', file);
              if (fs.existsSync(sourcePath)) {
                copyFileSync(sourcePath, destPath);
                console.log(`Copied ${file} to dist directory`);
              }
            });
          }
        }
      ]
    },
    copyPublicDir: true,
    assetsDir: 'assets'
  }
});