import { mkdir, rm, copyFile, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { composeFolio } from './nabz-folio.mjs';

const root = process.cwd();
const out = join(root, 'dist');
const outAssets = join(out, 'assets');
const film = Buffer.concat(await Promise.all(['001', '002'].map(part => readFile(join(root, `cloudflare/media/nabz-story.${part}`)))));
if (createHash('sha256').update(film).digest('hex') !== '03ed290ab32b98b14580c4669715f91c0237455409265b4317eb41272fffc411') throw new Error('NABZ story film is incomplete or corrupted.');
if (film.length > 25 * 1024 * 1024) throw new Error('NABZ story film exceeds the Cloudflare asset limit.');
await rm(out, { recursive: true, force: true });
await mkdir(outAssets, { recursive: true });

const assetUrl = (source) => source.replace(/{{\s*'([^']+)'\s*\|\s*asset_url\s*}}/g, '/assets/$1');

function expandProducts(source) {
  const match = source.match(/{%\s*assign\s+product_assets\s*=\s*'([^']+)'\s*\|\s*split:\s*','\s*%}/);
  if (!match) return source;
  const products = match[1].split(',').map((item) => {
    const [file, ...name] = item.split('|');
    return { file, name: name.join('|') };
  });
  source = source.replace(match[0], '');
  source = source.replace(/{%\s*for\s+product_asset\s+in\s+product_assets\s*%}([\s\S]*?){%\s*endfor\s*%}/g, (_, template) => products.map((product, index) => {
    const first = index === 0;
    let block = template.replace(/{%\s*assign\s+product_parts\s*=\s*product_asset\s*\|\s*split:\s*'\|'\s*%}/g, '');
    block = block.replace(/{%\s*if\s+forloop\.first\s*%}([\s\S]*?){%\s*endif\s*%}/g, (_, body) => {
      const [whenFirst, whenOther = ''] = body.split(/{%\s*else\s*%}/);
      return first ? whenFirst : whenOther;
    });
    block = block.replace(/{{\s*product_parts\[0\]\s*\|\s*asset_url\s*}}/g, `/assets/${product.file}`);
    block = block.replace(/{{\s*product_parts\[1\]\s*}}/g, product.name);
    block = block.replace(/{{\s*forloop\.index0\s*}}/g, String(index));
    block = block.replace(/{{\s*forloop\.index\s*\|\s*prepend:\s*'0'\s*\|\s*slice:\s*-2,\s*2\s*}}/g, String(index + 1).padStart(2, '0'));
    return block;
  }).join(''));
  return source;
}

let header = await readFile(join(root, 'sections/nabz-site-header.liquid'), 'utf8');
let main = await readFile(join(root, 'sections/nabz-clean-home.liquid'), 'utf8');

header = header
  .replace(/^{{[^\n]+stylesheet_tag[^\n]+}}\s*/m, '')
  .replace(/{%\s*unless\s+request\.design_mode\s*%}|{%\s*endunless\s*%}/g, '')
  .replace(/{{\s*routes\.root_url\s*}}/g, '/')
  .replace(/{{\s*routes\.cart_url\s*}}/g, '#products')
  .replace(/{{\s*cart\.item_count\s*}}/g, '0')
  .replace('href="#shoulders">Shoulders</a>', 'href="#story">Story</a>')
  .replace('href="/" aria-label="NABZ home"', 'href="#hero" aria-label="NABZ home"')
  .replace(/Bag \(0\)/g, 'Explore')
  .replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/g, '');
header = assetUrl(header);

main = expandProducts(main)
  .replace(/^{{[^\n]+stylesheet_tag[^\n]+}}\s*/m, '')
  .replace(/^<script[^\n]+nabz-clean-home\.js[^\n]+<\/script>\s*/m, '')
  .replace(/{%\s*form\s+'contact',\s*class:\s*'nabz-contact-atelier__form'\s*%}/g, '<form class="nabz-contact-atelier__form" data-static-contact-form>')
  .replace(/{%\s*if\s+form\.posted_successfully\?\s*%}[\s\S]*?{%\s*endif\s*%}/g, '')
  .replace(/{{\s*form\.errors\s*\|\s*default_errors\s*}}/g, '')
  .replace(/{%\s*endform\s*%}/g, '</form>')
  .replace(/{%\s*schema\s*%}[\s\S]*?{%\s*endschema\s*%}/g, '');
main = assetUrl(main);

const story = `
  <section class="nabz-chapter nabz-chapter--story" id="story" data-nabz-chapter data-chapter-label="The story">
    <div class="nabz-chapter__frame nabz-story">
      <div class="nabz-story__heading">
        <span class="nabz-folio-mark" aria-hidden="true">N / 04</span>
        <span class="nabz-kicker">The story</span>
        <h2>A new way to wear India.</h2>
      </div>
      <div class="nabz-story__film" data-story-film>
        <video controls playsinline preload="metadata" poster="/assets/nabz-film-cover.webp" data-story-video aria-label="NABZ brand story film">
          <source src="/assets/nabz-story.mp4" type="video/mp4">
        </video>
        <button class="nabz-story__play" type="button" data-story-play aria-label="Play NABZ brand film"><span aria-hidden="true">▶</span>Play the film</button>
        <p class="nabz-story__error" data-story-error role="status" hidden>The film could not load. <a href="/assets/nabz-story.mp4">Open the film</a></p>
      </div>
    </div>
  </section>`;
main = main.replace(/\s*<section class="nabz-chapter nabz-chapter--shoulders"[\s\S]*?<\/section>\s*(?=<section class="nabz-chapter nabz-chapter--contact")/, `\n${story}\n\n  `);
({main,header}=composeFolio(main,header));

const versionHash = createHash('sha256');
for (const file of [
  'assets/nabz-base.css',
  'assets/nabz-clean-home.css',
  'assets/nabz-clean-home.js',
  'cloudflare/nabz-mobile-native.css',
  'cloudflare/nabz-mobile-native.js',
  'cloudflare/nabz-standalone-fix.css',
  'cloudflare/nabz-folio.css',
  'cloudflare/nabz-entry.js',
  'cloudflare/nabz-folio.mjs',
]) versionHash.update(await readFile(join(root, file)));
const assetVersion = versionHash.digest('hex').slice(0, 12);

const head = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#f3efe7">
  <title>NABZ — The space between.</title>
  <meta name="description" content="NABZ. India’s textile language, re-cut into everyday shirts.">
  <script>document.documentElement.classList.add('nabz-js')</script>
  <link rel="preload" href="/assets/nabz-manrope.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/nabz-cormorant.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/nabz-cormorant-italic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="icon" href="/assets/nabz-favicon.png">
  <link rel="stylesheet" href="/assets/nabz-folio.css?v=${assetVersion}">
</head>
<body>`;
const tail = `
<script src="/assets/nabz-clean-home.js?v=${assetVersion}" defer></script>
<script src="/assets/nabz-mobile-native.js?v=${assetVersion}" defer></script>
</body>
</html>`;
const html = `${head}\n${header}\n${main}\n${tail}`;
if (/{[{%]/.test(html)) throw new Error('Unconverted Liquid remains in the standalone HTML.');
if ((html.match(/data-product-card/g) || []).length !== 6) throw new Error('The gallery must render all six product cards.');
if ((html.match(/data-product-select=/g) || []).length !== 6) throw new Error('The gallery must render all six selectors.');
await writeFile(join(out, 'index.html'), html);

const assetNames = await readdir(join(root, 'assets'));
for (const name of assetNames) {
  if (!name.startsWith('nabz-')) continue;
  await copyFile(join(root, 'assets', name), join(outAssets, name));
}
let runtime = (await readFile(join(root, 'assets/nabz-clean-home.js'), 'utf8')).replace('    bootChapterDeck(root);', '');
const entryStart=runtime.indexOf('  const bootEntry ='),entryEnd=runtime.indexOf('  const bootProductArchive =');
runtime=runtime.slice(0,entryStart)+(await readFile(join(root,'cloudflare/nabz-entry.js'),'utf8'))+'\n'+runtime.slice(entryEnd);
await writeFile(join(outAssets, 'nabz-clean-home.js'), runtime);
await copyFile(join(root, 'cloudflare/nabz-mobile-native.css'), join(outAssets, 'nabz-mobile-native.css'));
await copyFile(join(root, 'cloudflare/nabz-mobile-native.js'), join(outAssets, 'nabz-mobile-native.js'));
await copyFile(join(root, 'cloudflare/nabz-standalone-fix.css'), join(outAssets, 'nabz-standalone-fix.css'));

await copyFile(join(root,'cloudflare/nabz-deck-polish.css'),join(outAssets,'nabz-deck-polish.css'));
await copyFile(join(root,'cloudflare/nabz-folio.css'),join(outAssets,'nabz-folio.css'));
await copyFile(join(root,'cloudflare/fonts/manrope.woff2'),join(outAssets,'nabz-manrope.woff2'));
await copyFile(join(root,'cloudflare/fonts/Manrope-OFL.txt'),join(outAssets,'nabz-manrope-license.txt'));
await copyFile(join(root,'cloudflare/fonts/cormorant.woff2'),join(outAssets,'nabz-cormorant.woff2'));
await copyFile(join(root,'cloudflare/fonts/cormorant-italic.woff2'),join(outAssets,'nabz-cormorant-italic.woff2'));
await copyFile(join(root,'cloudflare/fonts/Cormorant-OFL.txt'),join(outAssets,'nabz-cormorant-license.txt'));
for(const name of ['nabz-clean-home.css','nabz-standalone-fix.css']){const path=join(outAssets,name);await writeFile(path,(await readFile(path,'utf8')).replaceAll('(min-width: 961px) and (min-height: 620px)','(min-width: 961px)'));}
await writeFile(join(outAssets, 'nabz-story.mp4'), film);
console.log('Original NABZ story film restored.');

await writeFile(join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=3600, must-revalidate\n`);
await writeFile(join(out, 'robots.txt'), 'User-agent: *\nAllow: /\n');
for (const match of html.matchAll(/(?:src|href|poster)="(\/assets\/[^"?]+)(?:\?[^" ]*)?"/g)) await stat(join(out, match[1]));
console.log(`NABZ Quiet Selvedge standalone build complete (${assetVersion}).`);
