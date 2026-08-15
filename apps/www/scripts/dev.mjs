import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const port = Number(process.env.PORT ?? 5181);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

function resolvePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  let rel = clean === '/' ? 'index.html' : clean.replace(/^\//, '');
  if (rel.endsWith('/')) {
    rel = `${rel}index.html`;
  }
  const full = normalize(join(root, rel));
  if (!full.startsWith(root + sep) && full !== root) {
    return null;
  }
  try {
    const st = statSync(full);
    if (st.isDirectory()) {
      return join(full, 'index.html');
    }
    return full;
  } catch {
    if (!extname(full)) {
      try {
        return join(full, 'index.html');
      } catch {
        return null;
      }
    }
    return null;
  }
}

createServer((req, res) => {
  const file = resolvePath(req.url ?? '/');
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  try {
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`@dndgem/www dev → http://127.0.0.1:${port}/`);
});
