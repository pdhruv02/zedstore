# NABZ Cloudflare Pages deployment

This branch contains a standalone, Shopify-independent rendering of the current NABZ landing page.

The original Shopify theme remains untouched on `main`.

## Cloudflare Pages settings

Use these values when connecting the GitHub repository to Cloudflare Pages:

- Repository: `pdhruv02/zedstore`
- Production branch: `cloudflare-static`
- Root directory: leave blank / repository root
- Framework preset: None
- Build command: `node cloudflare/build.mjs`
- Build output directory: `dist`
- Environment variables: none required for the landing page

The build copies the exact NABZ CSS and JavaScript from the theme source and mirrors the current Shopify-hosted NABZ photography into `dist/assets`. Once a deployment has been built, visitors are served the copied assets from Cloudflare rather than Shopify.

## What works without Shopify

- Exact five-chapter NABZ landing-page structure
- Header and footer styling
- Hero imagery and macro
- Eight-product interactive gallery
- Fit size/length controls and size chart
- Shoulder chapter
- Responsive/mobile behavior
- Existing JavaScript interactions
- Local Cloudflare-hosted static assets after build

## Intentionally not connected yet

### Ecommerce

Shopify product collection, cart, search and checkout routes no longer exist in a static landing page. The visible Shop/Bag navigation is retained but currently returns visitors to the product chapter. Ecommerce can be connected later without rebuilding the landing page.

### Contact form delivery

The contact form UI is retained exactly, but email delivery needs a destination/provider. `cloudflare/static.js` currently prevents a silent failed submission and displays a temporary status message. Connect a form endpoint or Pages Function before using the form for real messages.

## Asset migration safety

The first Cloudflare build attempts the known Shopify CDN locations for each exact NABZ image. It tries both theme asset paths used during development. The build deliberately fails if a required image cannot be retrieved, so Cloudflare will not publish a visually incomplete version.

If Shopify has already removed those CDN assets, restore the original images into the repository and replace the mirror step with local copies.
