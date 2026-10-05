export function composeFolio(main, header) {
  header = header.replace('>Explore</a>', '>Explore <span aria-hidden="true">↗</span></a>');
  main = main.replace(/<figure class="nabz-identity__macro">[\s\S]*?<\/figure>/, `
      <button class="nabz-detail-toggle" type="button" data-detail-toggle aria-expanded="false" aria-controls="NabzThreadDetail"><span>Thread, seen closer</span><span aria-hidden="true">↗</span></button>
      <figure class="nabz-identity__macro" id="NabzThreadDetail" hidden>
        <img src="/assets/nabz-embroidery-close-up.webp" alt="The Air Cable embroidery and cotton, seen close up" width="476" height="496">
        <figcaption><span>Air Cable / Embroidery study</span><span>A closer look changes everything.</span></figcaption>
      </figure>
      <span class="nabz-identity__caption">Air Cable · Embroidery study 01</span>`);
  main = main.replace('<em>The space between.</em>', '<em>The space<br>between.</em>');
  main = main.replace('<span class="nabz-folio-mark" aria-hidden="true">N / 01</span>', '<span class="nabz-folio-mark">01 / Identity</span>');
  main = main.replace('<span class="nabz-folio-mark" aria-hidden="true">N / 02</span>', '<span class="nabz-folio-mark">02 / Surface</span>');
  main = main.replace('<span class="nabz-folio-mark" aria-hidden="true">N / 03</span>', '<span class="nabz-folio-mark">03 / Fit</span>');
  main = main.replace('<span class="nabz-folio-mark" aria-hidden="true">N / 04</span>', '<span class="nabz-folio-mark">04 / Story</span>');
  main = main.replace('<span class="nabz-folio-mark" aria-hidden="true">N / 05</span>', '<span class="nabz-folio-mark">05 / Contact</span>');
  main = main.replace(/<h2>\s*<span>India’s textile language, re-cut into everyday shirts\.<\/span>\s*<em>Clean from a distance\. Unforgettable up close\.<\/em>\s*<\/h2>/, '<h2>Clean from<br>a distance.<em>Unforgettable<br>up close.</em></h2><p class="nabz-archive__description">India’s textile language,<br>re-cut into everyday shirts.</p>');
  main = main.replace('<h2>A new way to wear India.</h2>', '<h2>A new way<br>to <em>wear India.</em></h2><p class="nabz-story__description">The space between, in motion.</p>');
  main = main.replace('<span aria-hidden="true">▶</span>Play the film', '<span class="nabz-play-disc" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 5L19 12L9 19Z"></path></svg></span><span>Play the film<small>01:12 / Sound on</small></span>');
  main = main.replace('<h2>The line is open.</h2>', '<h2>For the<br>next <em>chapter.</em></h2>');
  main = main.replace('<p class="nabz-contact-atelier__support">Whatever it is, we’re here to respond.</p>', '<p class="nabz-contact-atelier__support">Promote NABZ. Give feedback. Just talk.</p>');
  main = main.replace(/<form class="nabz-contact-atelier__form" data-static-contact-form>[\s\S]*?<\/form>/, `<div class="nabz-contact-note"><span class="nabz-kicker">A note to NABZ</span><h3>Good things begin<br>with <em>a conversation.</em></h3><p>Online enquiries are currently paused.</p><a class="nabz-text-link" href="#hero">Back to the beginning <span aria-hidden="true">↑</span></a></div>`);
  main = main.replace('<span class="nabz-deck-ui__count" data-deck-count>', '<span class="nabz-deck-cue">Scroll to unfold <span aria-hidden="true">↓</span></span><span class="nabz-deck-ui__count" data-deck-count>');
  return {main,header};
}
