const OVERLAY_ATTR = 'data-qr-scanner-overlay';
const WRAPPER_ATTR = 'data-qr-scanner-wrapper';
const BADGE_CLASS = 'qr-scanner-badge';
const TOOLTIP_CLASS = 'qr-scanner-tooltip';

let stylesInjected = false;

export function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.id = 'qr-scanner-styles';
  style.textContent = `
    [${WRAPPER_ATTR}] {
      position: relative !important;
      display: inline-block !important;
    }
    [${OVERLAY_ATTR}] {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      border: 3px solid #2dd4bf !important;
      border-radius: 4px !important;
      pointer-events: none !important;
      z-index: 10000 !important;
      box-shadow: 0 0 0 1px rgba(45, 212, 191, 0.3), inset 0 0 20px rgba(45, 212, 191, 0.05) !important;
      animation: qr-scanner-fade-in 0.3s ease-out !important;
    }
    @keyframes qr-scanner-fade-in {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    .${BADGE_CLASS} {
      position: absolute !important;
      top: 4px !important;
      right: 4px !important;
      background: #0f172a !important;
      color: #2dd4bf !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      padding: 2px 6px !important;
      border-radius: 3px !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      letter-spacing: 0.5px !important;
      pointer-events: auto !important;
      cursor: pointer !important;
      border: 1px solid rgba(45, 212, 191, 0.3) !important;
      z-index: 10001 !important;
      line-height: 1.4 !important;
      transition: background 0.15s, color 0.15s !important;
      text-decoration: none !important;
    }
    .${BADGE_CLASS}:hover {
      background: #2dd4bf !important;
      color: #0f172a !important;
    }
    .${TOOLTIP_CLASS} {
      position: absolute !important;
      bottom: calc(100% + 8px) !important;
      right: 0 !important;
      background: #0f172a !important;
      color: #e2e8f0 !important;
      font-size: 11px !important;
      padding: 8px 12px !important;
      border-radius: 6px !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      max-width: 280px !important;
      word-break: break-all !important;
      line-height: 1.4 !important;
      z-index: 10002 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
      border: 1px solid rgba(45, 212, 191, 0.2) !important;
      pointer-events: auto !important;
      display: none !important;
      white-space: pre-wrap !important;
    }
    .${BADGE_CLASS}:hover + .${TOOLTIP_CLASS},
    .${TOOLTIP_CLASS}:hover {
      display: block !important;
    }
  `;
  document.head.appendChild(style);
}

export function addOverlay(img: HTMLImageElement, data: string) {
  if (img.closest(`[${WRAPPER_ATTR}]`)) return;

  const wrapper = document.createElement('span');
  wrapper.setAttribute(WRAPPER_ATTR, '');

  const overlay = document.createElement('span');
  overlay.setAttribute(OVERLAY_ATTR, '');

  const badge = document.createElement('span');
  badge.className = BADGE_CLASS;
  badge.textContent = 'QR';
  badge.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(data).then(() => {
      badge.textContent = 'Copied!';
      setTimeout(() => { badge.textContent = 'QR'; }, 1500);
    }).catch(() => {});
  });

  const tooltip = document.createElement('span');
  tooltip.className = TOOLTIP_CLASS;
  tooltip.textContent = data;

  overlay.appendChild(badge);
  overlay.appendChild(tooltip);

  img.parentNode?.insertBefore(wrapper, img);
  wrapper.appendChild(img);
  wrapper.appendChild(overlay);
}

export function removeAllOverlays() {
  document.querySelectorAll(`[${WRAPPER_ATTR}]`).forEach((wrapper) => {
    const img = wrapper.querySelector('img');
    if (img && wrapper.parentNode) {
      wrapper.parentNode.insertBefore(img, wrapper);
      wrapper.remove();
    }
  });

  const styleEl = document.getElementById('qr-scanner-styles');
  if (styleEl) styleEl.remove();
  stylesInjected = false;
}
