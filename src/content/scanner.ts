import jsQR from 'jsqr';

const MAX_DIMENSION = 2048;

function getImageData(img: HTMLImageElement): ImageData | null {
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(img, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  } catch {
    return null;
  }
}

function getImageDataViaFetch(src: string): Promise<ImageData | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'FETCH_IMAGE', url: src },
      (response) => {
        if (chrome.runtime.lastError || !response?.dataUrl) {
          resolve(null);
          return;
        }

        const img = new Image();
        img.onload = () => {
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const scale = MAX_DIMENSION / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(ctx.getImageData(0, 0, width, height));
        };
        img.onerror = () => resolve(null);
        img.src = response.dataUrl;
      }
    );
  });
}

function detectQr(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });

  if (result) return result.data;

  const inverted = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'onlyInvert',
  });

  return inverted?.data ?? null;
}

export async function scanImageForQr(img: HTMLImageElement): Promise<string | null> {
  let imageData = getImageData(img);

  if (!imageData && img.src.startsWith('http')) {
    imageData = await getImageDataViaFetch(img.src);
  }

  if (!imageData) return null;
  return detectQr(imageData);
}
