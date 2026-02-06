import { scanImageForQr } from './scanner';
import { addOverlay, removeAllOverlays, injectStyles } from './overlay';

interface QrResult {
  data: string;
  imageUrl: string;
}

let isEnabled = false;
let isScanning = false;
let results: QrResult[] = [];
let scannedImages = new Set<HTMLImageElement>();
let imageCount = 0;
let observer: MutationObserver | null = null;

function getState() {
  return {
    results: [...results],
    imageCount,
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

  await Promise.allSettled(promises);
  isScanning = false;
}

function updateBadge() {
  chrome.runtime.sendMessage({
    type: 'UPDATE_BADGE',
    count: results.length,
  }).catch(() => {});
}

function startObserving() {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLImageElement) {
          scheduleImageScan(node);
        }
        if (node instanceof HTMLElement) {
          const imgs = node.querySelectorAll<HTMLImageElement>('img');
          for (const img of imgs) {
            scheduleImageScan(img);
          }
        }
      }
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
  scannedImages = new Set();
  imageCount = 0;
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
