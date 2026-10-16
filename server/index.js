import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dispatchApi } from './routes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 5000);
const isProduction = process.env.NODE_ENV === 'production';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function serveProductionFile(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const candidate = path.resolve(root, 'dist', `.${decodeURIComponent(pathname)}`);
  const distRoot = path.resolve(root, 'dist');
  let filePath = candidate.startsWith(`${distRoot}${path.sep}`) ? candidate : path.join(distRoot, 'index.html');

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error('not a file');
  } catch {
    filePath = path.join(distRoot, 'index.html');
  }

  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(content);
  } catch {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('The frontend build is missing. Run npm run build first.');
  }
}

const server = http.createServer();
let vite;

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  vite = await createViteServer({
    configFile: path.join(root, 'vite.config.ts'),
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true },
    appType: 'spa',
  });
}

server.on('request', async (req, res) => {
  if ((req.url || '').startsWith('/api/')) {
    try {
      await dispatchApi(req, res);
    } catch (error) {
      const status = Number(error.status) || 500;
      if (status >= 500) console.error('API request failed:', error);
      if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      if (!res.writableEnded) {
        res.end(JSON.stringify({ error: status >= 500 ? 'حدث خطأ داخلي. حاول مرة أخرى.' : error.message }));
      }
    }
    return;
  }

  if (isProduction) {
    await serveProductionFile(req, res);
    return;
  }

  vite.middlewares(req, res, (error) => {
    if (error) {
      console.error(error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Second Chance API and web server listening on port ${port}`);
});
