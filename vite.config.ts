import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Strip noisy console calls from production bundles. We keep console.warn
  // and console.error so observability tooling can still capture problems.
  // Use the typed logger in src/lib/logger.ts (`logger.info`, `logger.debug`)
  // for anything that needs to survive a release build.
  esbuild: mode === 'production' ? {
    pure: ['console.log', 'console.debug', 'console.info', 'console.trace'],
    legalComments: 'none',
  } : undefined,
  optimizeDeps: {
    exclude: [
      'ogg-opus-decoder',
      '@eshaz/web-worker',
      '@wasm-audio-decoders/common',
      '@wasm-audio-decoders/opus-ml'
    ]
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@tensorflow') || id.includes('blazeface')) return 'ml-tfjs';
          if (id.includes('@mediapipe')) return 'ml-mediapipe';
          if (id.includes('@huggingface') || id.includes('transformers')) return 'ml-hf';
          if (id.includes('face-api')) return 'ml-faceapi';
          if (id.includes('@radix-ui')) return 'ui-radix';
          if (id.includes('recharts') || id.includes('d3')) return 'charts';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@tanstack')) return 'tanstack';
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: false, // Using external manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Raised from 5MB because ML chunks (mediapipe, tfjs, hf) exceed it.
        // Workbox silently skipped caching the app shell at the old limit.
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));