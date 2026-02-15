import { DeckData, BrandNucleus } from "@/types/project";

export function renderDeckToHtml(
  deck: DeckData,
  brand: BrandNucleus | null
): string {
  const primaryColor = brand?.colors.primary || "#7c3aed";
  const bgColor = brand?.colors.background || "#0a0a0b";
  const textColor = brand?.colors.text.primary || "#fafafa";
  const accentColor = brand?.colors.accent || "#7c3aed";
  const surfaceColor = brand?.colors.surface || "#18181b";
  const headingFont = brand?.typography.heading.family || "system-ui, sans-serif";
  const bodyFont = brand?.typography.body.family || "system-ui, sans-serif";

  const slides = deck.slides
    .sort((a, b) => a.order - b.order)
    .map(
      (slide, i) =>
        `    <div class="slide${i === 0 ? " active" : ""}" data-slide="${i}">
      ${slide.content}
    </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deck.name}</title>
  <style>
    :root {
      --bg: ${bgColor};
      --text: ${textColor};
      --accent: ${accentColor};
      --primary: ${primaryColor};
      --surface: ${surfaceColor};
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: ${bodyFont};
      background: var(--bg);
      color: var(--text);
      overflow: hidden;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: ${headingFont};
    }

    .deck-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 5vw;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }

    .slide.active {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }

    .slide.prev {
      opacity: 0;
      transform: translateX(-100%);
    }

    .anim {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .slide.active .anim { opacity: 1; transform: translateY(0); }
    .slide.active .anim.d1 { transition-delay: 0.08s; }
    .slide.active .anim.d2 { transition-delay: 0.16s; }
    .slide.active .anim.d3 { transition-delay: 0.24s; }
    .slide.active .anim.d4 { transition-delay: 0.32s; }
    .slide.active .anim.d5 { transition-delay: 0.40s; }

    .progress-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: var(--surface);
      z-index: 100;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent);
      transition: width 0.3s ease;
      width: 0%;
    }

    .slide-counter {
      position: fixed;
      bottom: 12px;
      right: 16px;
      font-size: 12px;
      color: var(--text);
      opacity: 0.5;
      z-index: 100;
    }

    .nav-prev, .nav-next {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      background: var(--surface);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--text);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      opacity: 0.3;
      transition: opacity 0.2s;
    }
    .nav-prev:hover, .nav-next:hover { opacity: 0.8; }
    .nav-prev { left: 16px; }
    .nav-next { right: 16px; }

    @media print {
      .slide { position: relative !important; opacity: 1 !important; transform: none !important; page-break-after: always; pointer-events: auto !important; }
      .progress-bar, .slide-counter, .nav-prev, .nav-next { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="deck-container">
${slides}
  </div>

  <div class="progress-bar"><div class="progress-fill"></div></div>
  <div class="slide-counter">1 / ${deck.slides.length}</div>
  <button class="nav-prev">&larr;</button>
  <button class="nav-next">&rarr;</button>

  <script>
    let current = 0;
    const slides = document.querySelectorAll('.slide');
    const total = slides.length;

    function updateSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev');
        if (i === index) slide.classList.add('active');
        else if (i < index) slide.classList.add('prev');
      });
      const progress = document.querySelector('.progress-fill');
      const counter = document.querySelector('.slide-counter');
      if (progress) progress.style.width = ((index + 1) / total * 100) + '%';
      if (counter) counter.textContent = (index + 1) + ' / ' + total;
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (current < total - 1) { current++; updateSlide(current); }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (current > 0) { current--; updateSlide(current); }
      }
    });

    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
    document.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && current < total - 1) { current++; updateSlide(current); }
        else if (diff < 0 && current > 0) { current--; updateSlide(current); }
      }
    });

    document.querySelector('.nav-prev')?.addEventListener('click', () => { if (current > 0) { current--; updateSlide(current); } });
    document.querySelector('.nav-next')?.addEventListener('click', () => { if (current < total - 1) { current++; updateSlide(current); } });

    updateSlide(0);
  </script>
</body>
</html>`;
}
