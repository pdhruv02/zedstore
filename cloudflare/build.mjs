import { mkdir, rm, copyFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const out = join(root, 'dist');
const outAssets = join(out, 'assets');

await rm(out, { recursive: true, force: true });
await mkdir(outAssets, { recursive: true });

const copy = async (from, to) => copyFile(join(root, from), join(out, to));

await copy('cloudflare/index.html', 'index.html');
await copy('assets/nabz-clean-home.css', 'assets/nabz-clean-home.css');
await copy('assets/nabz-five-chapters-fix.css', 'assets/nabz-five-chapters-fix.css');
await copy('assets/nabz-clean-home.js', 'assets/nabz-clean-home.js');
await copy('cloudflare/static.js', 'assets/nabz-static.js');
await copy('nabz-clean-restart/assets/nabz-logo-embroidered-safe.png', 'assets/nabz-logo-embroidered-safe.png');

const baseCssSource = await readFile(join(root, 'assets/nabz-base.css'), 'utf8');
const localBaseCss = baseCssSource.replaceAll(
  'https://cdn.shopify.com/s/files/1/0766/4042/0034/files/nabz-background-study-04.png?v=1784820062',
  '/assets/nabz-background-study-04.png'
);
await writeFile(join(outAssets, 'nabz-base.css'), localBaseCss);

const store = 'https://cdn.shopify.com/s/files/1/0766/4042/0034';
const imageNames = [
  'nabz-hero-self-contour-hq.webp',
  'nabz-hero-self-contour-macro-hq.webp',
  'nabz-product-1-hq.webp',
  'nabz-product-2-hq.webp',
  'nabz-product-3-hq.webp',
  'nabz-product-4-hq.webp',
  'nabz-product-5-hq.webp',
  'nabz-product-6-hq.webp',
  'nabz-product-7-hq.webp',
  'nabz-product-8-hq.webp',
  'nabz-hero-air-cable-hq.webp'
];

async function fetchWithTimeout(url, timeoutMs = 25000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'NABZ-Cloudflare-Migration/1.0' }
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function mirror(name, candidates) {
  const errors = [];
  for (const url of candidates) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        errors.push(`${response.status} ${url}`);
        continue;
      }
      const body = Buffer.from(await response.arrayBuffer());
      if (!body.length) {
        errors.push(`empty ${url}`);
        continue;
      }
      await writeFile(join(outAssets, name), body);
      console.log(`Mirrored ${name} (${body.length} bytes)`);
      return;
    } catch (error) {
      errors.push(`${error?.message || error} ${url}`);
    }
  }
  throw new Error(`Could not mirror ${name}. Tried:\n${errors.join('\n')}`);
}

await Promise.all(imageNames.map((name) => mirror(name, [
  `${store}/t/21/assets/${name}`,
  `${store}/t/27/assets/${name}`
])));

await mirror('nabz-background-study-04.png', [
  `${store}/files/nabz-background-study-04.png?v=1784820062`,
  `${store}/files/nabz-background-study-04.png`
]);

await writeFile(join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);

await writeFile(join(out, 'robots.txt'), 'User-agent: *\nAllow: /\n');

console.log('NABZ static build complete: dist/');
