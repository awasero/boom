import { GeneratedFile } from "@/types/project";

export function generatePreviewHtml(
  files: GeneratedFile[],
  currentPage: string = "index.html",
  inspectMode: boolean = false
): string {
  const navigationScript = `
    <script>
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link) {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            e.preventDefault();
            window.parent.postMessage({ type: 'navigate', page: href }, '*');
          }
        }
      }, true);
    </script>
  `;

  const inspectionScript = inspectMode ? `
    <style>
      .boom-inspect-highlight {
        outline: 2px solid #10b981 !important;
        outline-offset: 2px !important;
        cursor: crosshair !important;
      }
      .boom-inspect-tooltip {
        position: fixed;
        background: #18181b;
        color: #e4e4e7;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-family: ui-monospace, monospace;
        z-index: 999999;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        border: 1px solid #3f3f46;
        max-width: 300px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .boom-inspect-tooltip .tag { color: #a78bfa; }
      .boom-inspect-tooltip .id { color: #34d399; }
      .boom-inspect-tooltip .cls { color: #60a5fa; }
      .boom-inspect-tooltip .hint { color: #71717a; font-size: 10px; display: block; margin-top: 4px; }
    </style>
    <script>
      (function() {
        let tooltip = null;
        let currentEl = null;

        function createTooltip() {
          tooltip = document.createElement('div');
          tooltip.className = 'boom-inspect-tooltip';
          document.body.appendChild(tooltip);
        }

        function getElementInfo(el) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? '#' + el.id : '';
          const classes = el.className && typeof el.className === 'string'
            ? '.' + el.className.split(' ').filter(c => c && !c.startsWith('boom-')).join('.')
            : '';
          return { tag, id, classes };
        }

        function formatTooltip(info) {
          let html = '<span class="tag">' + info.tag + '</span>';
          if (info.id) html += '<span class="id">' + info.id + '</span>';
          if (info.classes) html += '<span class="cls">' + info.classes + '</span>';
          html += '<span class="hint">Double-click to select</span>';
          return html;
        }

        function getSelector(el) {
          const info = getElementInfo(el);
          if (info.id) return info.tag + info.id;
          if (info.classes) return info.tag + info.classes;
          return info.tag;
        }

        function getElementContext(el) {
          const selector = getSelector(el);
          const textContent = el.textContent?.trim().slice(0, 100) || '';
          const outerHtml = el.outerHTML?.slice(0, 500) || '';
          const parent = el.parentElement;
          const parentInfo = parent ? getElementInfo(parent) : null;
          const parentSelector = parentInfo ? (parentInfo.tag + (parentInfo.id || parentInfo.classes || '')) : '';
          let section = el.closest('section, header, footer, main, nav, article, aside');
          const sectionInfo = section ? getElementInfo(section) : null;
          const sectionSelector = sectionInfo ? (sectionInfo.tag + (sectionInfo.id || sectionInfo.classes || '')) : '';
          return { selector, parent: parentSelector, section: sectionSelector, text: textContent, html: outerHtml };
        }

        document.addEventListener('mouseover', function(e) {
          const el = e.target;
          if (el === document.body || el === document.documentElement) return;
          if (el.className && typeof el.className === 'string' && el.className.includes('boom-')) return;
          if (currentEl) currentEl.classList.remove('boom-inspect-highlight');
          currentEl = el;
          el.classList.add('boom-inspect-highlight');
          if (!tooltip) createTooltip();
          tooltip.innerHTML = formatTooltip(getElementInfo(el));
          tooltip.style.display = 'block';
        });

        document.addEventListener('mousemove', function(e) {
          if (tooltip) {
            const x = Math.min(e.clientX + 12, window.innerWidth - tooltip.offsetWidth - 10);
            const y = Math.min(e.clientY + 12, window.innerHeight - tooltip.offsetHeight - 10);
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
          }
        });

        document.addEventListener('mouseout', function(e) {
          if (currentEl && !currentEl.contains(e.relatedTarget)) {
            currentEl.classList.remove('boom-inspect-highlight');
            currentEl = null;
            if (tooltip) tooltip.style.display = 'none';
          }
        });

        document.addEventListener('dblclick', function(e) {
          if (currentEl) {
            e.preventDefault();
            e.stopPropagation();
            const context = getElementContext(currentEl);
            window.parent.postMessage({ type: 'elementSelected', info: context }, '*');
          }
        });

        document.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      })();
    </script>
  ` : '';

  let htmlFile = files.find((f) => f.path === currentPage);
  if (!htmlFile) {
    htmlFile = files.find((f) => f.path === "index.html" || f.path.endsWith("/index.html"));
  }

  if (htmlFile) {
    let html = htmlFile.content;

    // Inline CSS files
    const cssFiles = files.filter((f) => f.path.endsWith(".css"));
    for (const cssFile of cssFiles) {
      const cssName = cssFile.path.split("/").pop();
      const regex = new RegExp(
        `<link[^>]*href=["'](?:\\.\\/)?${cssName?.replace(".", "\\.")}["'][^>]*>`,
        "i"
      );
      html = html.replace(regex, `<style>${cssFile.content}</style>`);
    }

    // Inline JS files
    const jsFiles = files.filter((f) => f.path.endsWith(".js"));
    for (const jsFile of jsFiles) {
      const jsName = jsFile.path.split("/").pop();
      const regex = new RegExp(
        `<script[^>]*src=["'](?:\\.\\/)?${jsName?.replace(".", "\\.")}["'][^>]*></script>`,
        "i"
      );
      html = html.replace(regex, `<script>${jsFile.content}</script>`);
    }

    // Ensure Tailwind CDN
    if (!html.includes("tailwindcss.com")) {
      html = html.replace("</head>", `<script src="https://cdn.tailwindcss.com"></script></head>`);
    }

    // Add navigation/inspection script
    html = html.replace("</body>", `${inspectMode ? inspectionScript : navigationScript}</body>`);

    return html;
  }

  return `
    <!DOCTYPE html>
    <html><head><style>
      body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #71717a; background: #0a0a0b; }
    </style></head>
    <body><p>No preview available yet</p></body></html>
  `;
}
