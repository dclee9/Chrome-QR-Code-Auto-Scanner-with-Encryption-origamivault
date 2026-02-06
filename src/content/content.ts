import { scanImageForQr } from './scanner';
import { addOverlay, removeAllOverlays, injectStyles } from './overlay';

interface QrResult {
  data: string;
  imageUrl: string;
}

interface TextResult {
  data: string;
  source: 'text';
}

const BASE64_RE = /^[A-Za-z0-9+/\n\r]+=*$/;
const MIN_CIPHER_LEN = 40;

function looksLikeCiphertext(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_CIPHER_LEN) return false;
  if (trimmed.includes(' ') && trimmed.split(' ').length > 3) return false;
  return BASE64_RE.test(trimmed);
}

let isEnabled = false;
let isScanning = false;
let results: QrResult[] = [];
let textResults: TextResult[] = [];
let scannedImages = new Set<HTMLImageElement>();
let scannedTextNodes = new WeakSet<Element>();
let imageCount = 0;
let textElementCount = 0;
let observer: MutationObserver | null = null;

function getState() {
  return {
    results: [...results],
    textResults: [...textResults],
    imageCount,
    textElementCount,
    scanning: isScanning,
  };
}

async function scanImage(img: HTMLImageElement) {
  if (scannedImages.has(img)) return;
  if (!img.complete || img.naturalWidth === 0) return;
  if (img.naturalWidth < 20 || img.naturalHeight < 20) return;

  scannedImages.add(img);
  imageCount++;

  try {
    const data = await scanImageForQr(img);
    if (data) {
      const alreadyFound = results.some((r) => r.data === data && r.imageUrl === img.src);
      if (!alreadyFound) {
        results.push({ data, imageUrl: img.src });
        addOverlay(img, data);
        updateBadge();
      }
    }
  } catch {
    // skip
  }
}

function scanTextElements() {
  const textSelectors = 'p, span, div, pre, code, td, li, blockquote, a';
  const elements = document.querySelectorAll<HTMLElement>(textSelectors);

  for (const el of elements) {
    if (scannedTextNodes.has(el)) continue;
    if (el.children.length > 0 && el.querySelector(textSelectors)) continue;

    const text = el.textContent?.trim();
    if (!text) continue;

    scannedTextNodes.add(el);
    textElementCount++;

    if (looksLikeCiphertext(text)) {
      const alreadyFound = textResults.some((r) => r.data === text);
      if (!alreadyFound) {
        textResults.push({ data: text, source: 'text' });
        updateBadge();
      }
    }
  }
}

async function scanAllImages() {
  if (!isEnabled || isScanning) return;
  isScanning = true;

  const images = document.querySelectorAll<HTMLImageElement>('img');
  const promises: Promise<void>[] = [];

  for (const img of images) {
    if (img.complete && img.naturalWidth > 0) {
      promises.push(scanImage(img));
    } else {
      const handler = () => {
        if (isEnabled) scanImage(img);
      };
      img.addEventListener('load', handler, { once: true });
    }
  }

  scanTextElements();

  await Promise.allSettled(promises);
  isScanning = false;
}

function updateBadge() {
  chrome.runtime.sendMessage({
    type: 'UPDATE_BADGE',
    count: results.length + textResults.length,
  }).catch(() => {});
}

function startObserving() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    let hasNewNodes = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLImageElement) {
          scheduleImageScan(node);
        }
        if (node instanceof HTMLElement) {
          hasNewNodes = true;
          const imgs = node.querySelectorAll<HTMLImageElement>('img');
          for (const img of imgs) {
            scheduleImageScan(img);
          }
        }
      }
    }
    if (hasNewNodes) {
      scanTextElements();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function scheduleImageScan(img: HTMLImageElement) {
  if (img.complete && img.naturalWidth > 0) {
    scanImage(img);
  } else {
    img.addEventListener('load', () => {
      if (isEnabled) scanImage(img);
    }, { once: true });
  }
}

function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function reset() {
  stopObserving();
  removeAllOverlays();
  results = [];
  textResults = [];
  scannedImages = new Set();
  scannedTextNodes = new WeakSet();
  imageCount = 0;
  textElementCount = 0;
  isScanning = false;
}

async function enable() {
  isEnabled = true;
  injectStyles();
  await scanAllImages();
  startObserving();
}

function disable() {
  isEnabled = false;
  reset();
  updateBadge();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TOGGLE_SCANNING') {
    if (message.enabled) {
      enable().then(() => sendResponse(getState()));
    } else {
      disable();
      sendResponse(getState());
    }
    return true;
  }

  if (message.type === 'GET_RESULTS') {
    sendResponse(getState());
    return false;
  }
});

chrome.storage.local.get(['autoScanEnabled'], (result) => {
  if (result.autoScanEnabled) {
    enable();
  }
});
