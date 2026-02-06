const STORAGE_KEY = 'ov_enc_key';
const TTL_MS = 30 * 60 * 1000;

interface StoredKey {
  key: string;
  expiresAt: number;
}

const isChromeExtension = typeof chrome !== 'undefined' && !!chrome.storage;

function setViaChrome(data: StoredKey): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, resolve);
  });
}

function getViaChrome(): Promise<StoredKey | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result: Record<string, unknown>) => {
      resolve((result[STORAGE_KEY] as StoredKey) ?? null);
    });
  });
}

function removeViaChrome(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, resolve);
  });
}

export async function saveKey(key: string): Promise<void> {
  const data: StoredKey = { key, expiresAt: Date.now() + TTL_MS };

  if (isChromeExtension) {
    await setViaChrome(data);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export async function loadKey(): Promise<string | null> {
  let data: StoredKey | null = null;

  if (isChromeExtension) {
    data = await getViaChrome();
  } else {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }
    }
  }

  if (!data) return null;

  if (Date.now() > data.expiresAt) {
    await clearKey();
    return null;
  }

  return data.key;
}

export async function clearKey(): Promise<void> {
  if (isChromeExtension) {
    await removeViaChrome();
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getRemainingMs(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}

export async function getExpiry(): Promise<number | null> {
  let data: StoredKey | null = null;

  if (isChromeExtension) {
    data = await getViaChrome();
  } else {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = null;
      }
    }
  }

  if (!data || Date.now() > data.expiresAt) return null;
  return data.expiresAt;
}
