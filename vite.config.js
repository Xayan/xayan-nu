import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Build configuration
  build: {
    // Output directory - Hugo will serve these files
    outDir: 'static/dist',
    // Generate manifest for asset mapping
    manifest: true,
    // Multiple entry points
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/js/main.js'),
        styles: path.resolve(__dirname, 'src/css/main.scss')
      },
      output: {
        // Organize built files
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({name}) => {
          if (/\.(css)$/.test(name ?? '')) {
            return 'css/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    // Clean output directory on build
    emptyOutDir: true
  },
  // CSS preprocessing
  css: {
    preprocessorOptions: {
      scss: {
        // Include paths for Sass imports
        includePaths: [path.resolve(__dirname, 'assets/sass')]
      }
    }
  },
  // Base path for assets
  base: '/dist/',
  // Development server
  server: {
    // Watch for changes in Hugo content and layouts
    watch: {
      include: ['src/**/*', 'assets/**/*']
    }
  },
  // Public directory for static assets
  publicDir: false // We don't need Vite's public dir since Hugo handles static files
});