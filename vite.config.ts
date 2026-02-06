import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'build-extension-scripts',
      apply: 'build',
      async closeBundle() {
        const esbuild = await import('esbuild');
        await esbuild.build({
          entryPoints: {
            content: 'src/content/content.ts',
            background: 'src/background/background.ts',
          },
          bundle: true,
          outdir: 'dist',
          format: 'iife',
          target: 'chrome120',
          minify: true,
        });
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
