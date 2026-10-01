import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'zip-download-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/amibroker-web-project.zip' || req.url === '/api/download-project-zip') {
              const zipPath = path.resolve('public/amibroker-web-project.zip');
              if (fs.existsSync(zipPath)) {
                res.writeHead(200, {
                  'Content-Type': 'application/zip',
                  'Content-Disposition': 'attachment; filename="amibroker-web-project.zip"',
                  'Content-Length': fs.statSync(zipPath).size,
                });
                fs.createReadStream(zipPath).pipe(res);
                return;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
