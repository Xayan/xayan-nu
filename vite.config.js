import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,

  // Plugins
  plugins: [svelte({
    compilerOptions: {
      // Enable custom element compilation for better Hugo integration
      customElement: true,
    },
  })],

  // Build configuration
  build: {
    // Output to Hugo's static directory so it can be served
    outDir: './static/dist',
    emptyOutDir: true,

    // Asset handling
    rollupOptions: {
      input: {
        // Main entry point that includes JS and CSS
        main: resolve(__dirname, 'src/main.js'),
      },
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name].[hash].${extType}`;
          }
          return `assets/[name].[hash].${extType}`;
        },
      },
    },

    // Generate manifest for Hugo integration
    manifest: true,

    // Development mode specific settings
    sourcemap: process.env.NODE_ENV === 'development',
  },

  // CSS preprocessing
  css: {
    preprocessorOptions: {
      scss: {
        // Import paths for SCSS
        includePaths: ['./assets/sass'],
      },
    },
  },

  // Development server (mainly for testing Vite builds)
  server: {
    port: 3001,
    open: false,
  },
});
