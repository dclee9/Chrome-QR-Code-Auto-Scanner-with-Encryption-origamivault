// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      name: "build-extension-scripts",
      apply: "build",
      async closeBundle() {
        const esbuild = await import("file:///home/project/node_modules/esbuild/lib/main.js");
        await esbuild.build({
          entryPoints: {
            content: "src/content/content.ts",
            background: "src/background/background.ts"
          },
          bundle: true,
          outdir: "dist",
          format: "iife",
          target: "chrome120",
          minify: true
        });
      }
    }
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHtcbiAgICAgIG5hbWU6ICdidWlsZC1leHRlbnNpb24tc2NyaXB0cycsXG4gICAgICBhcHBseTogJ2J1aWxkJyxcbiAgICAgIGFzeW5jIGNsb3NlQnVuZGxlKCkge1xuICAgICAgICBjb25zdCBlc2J1aWxkID0gYXdhaXQgaW1wb3J0KCdlc2J1aWxkJyk7XG4gICAgICAgIGF3YWl0IGVzYnVpbGQuYnVpbGQoe1xuICAgICAgICAgIGVudHJ5UG9pbnRzOiB7XG4gICAgICAgICAgICBjb250ZW50OiAnc3JjL2NvbnRlbnQvY29udGVudC50cycsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAnc3JjL2JhY2tncm91bmQvYmFja2dyb3VuZC50cycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidW5kbGU6IHRydWUsXG4gICAgICAgICAgb3V0ZGlyOiAnZGlzdCcsXG4gICAgICAgICAgZm9ybWF0OiAnaWlmZScsXG4gICAgICAgICAgdGFyZ2V0OiAnY2hyb21lMTIwJyxcbiAgICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9LFxuICBdLFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUVsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsTUFBTSxjQUFjO0FBQ2xCLGNBQU0sVUFBVSxNQUFNLE9BQU8sdURBQVM7QUFDdEMsY0FBTSxRQUFRLE1BQU07QUFBQSxVQUNsQixhQUFhO0FBQUEsWUFDWCxTQUFTO0FBQUEsWUFDVCxZQUFZO0FBQUEsVUFDZDtBQUFBLFVBQ0EsUUFBUTtBQUFBLFVBQ1IsUUFBUTtBQUFBLFVBQ1IsUUFBUTtBQUFBLFVBQ1IsUUFBUTtBQUFBLFVBQ1IsUUFBUTtBQUFBLFFBQ1YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
