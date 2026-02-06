function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    const base64 = arrayBufferToBase64(buffer);
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_IMAGE') {
    fetchImageAsDataUrl(message.url)
      .then((dataUrl) => sendResponse({ dataUrl }))
      .catch(() => sendResponse({ dataUrl: null }));
    return true;
  }

  if (message.type === 'UPDATE_BADGE') {
    const count = message.count;
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.action.setBadgeText({
        text: count > 0 ? String(count) : '',
        tabId,
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#2dd4bf',
        tabId,
      });
    }
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});
