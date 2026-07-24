# NABZ background production candidate

The selected woven landscape storefront includes a scroll-controlled opening built from the supplied 154-frame shirt sequence.

## Scroll runtime verification

The frame controller was corrected to:

- Load Shopify CDN sheets without forced anonymous CORS.
- Initialize on DOM ready, page restore, and Shopify section load.
- Draw the latest requested frame after delayed sheet loading.
- Preload the opening sheets and retain only nearby sheets in memory.
- Keep frame progression active when reduced motion is enabled.

A Chromium functional test confirmed forward positions 001, 039, 078, and 154, followed by reverse positions 078 and 001. The canvas remained ready and produced no page or console errors.
