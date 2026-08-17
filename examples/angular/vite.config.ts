import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
  optimizeDeps: {
    include: [
      '@angular/core',
      '@angular/compiler',
      '@angular/platform-browser',
      'rxjs',
      'rxjs/operators',
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5177,
    strictPort: true,
  },
});
