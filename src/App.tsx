import { useEffect, useState, useCallback } from 'react';
import { ScanLine, ShieldCheck } from 'lucide-react';
import ScannerTab from './components/ScannerTab';
import CryptoTab from './components/CryptoTab';

interface QrResult {
  data: string;
  imageUrl: string;
}

interface TabResults {
  results: QrResult[];
  imageCount: number;
  scanning: boolean;
}

type ActiveTab = 'scanner' | 'crypto';

const isChromeExtension = typeof chrome !== 'undefined' && !!chrome.storage;

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [enabled, setEnabled] = useState(false);
  const [tabResults, setTabResults] = useState<TabResults>({
    results: [],
    imageCount: 0,
    scanning: false,
  });
  const [loading, setLoading] = useState(true);
  const [decryptText, setDecryptText] = useState<string | undefined>();

  useEffect(() => {
    if (!isChromeExtension) {
      setLoading(false);
      return;
    }

    chrome.storage.local.get(['autoScanEnabled'], (result: Record<string, unknown>) => {
      setEnabled(Boolean(result.autoScanEnabled));
      setLoading(false);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_RESULTS' }, (response) => {
          if (chrome.runtime.lastError) return;
          if (response) {
            setTabResults(response);
          }
        });
      }
    });
  }, []);

  const handleToggle = useCallback((value: boolean) => {
    setEnabled(value);

    if (!isChromeExtension) return;

    chrome.storage.local.set({ autoScanEnabled: value });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: 'TOGGLE_SCANNING', enabled: value },
          (response) => {
            if (chrome.runtime.lastError) return;
            if (response) {
              setTabResults(response);
            }
          }
        );
      }
    });
  }, []);

  useEffect(() => {
    if (!isChromeExtension || !enabled) return;

    const interval = setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_RESULTS' }, (response) => {
            if (chrome.runtime.lastError) return;
            if (response) {
              setTabResults(response);
            }
          });
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [enabled]);

  const handleDecrypt = useCallback((data: string) => {
    setDecryptText(data);
    setActiveTab('crypto');
  }, []);

  if (loading) {
    return (
      <div className="w-[380px] min-h-[200px] bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-slate-900 text-white">
      <div className="px-5 pt-4 pb-3 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">OrigamiVault QR Scanner</h1>
            <p className="text-[10px] text-slate-500">Scan, encrypt & decrypt QR codes</p>
          </div>
        </div>

        <div className="flex rounded-lg bg-slate-800/80 p-0.5">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'scanner'
                ? 'bg-slate-700/80 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <ScanLine className="w-3 h-3" />
            Scanner
            {tabResults.results.length > 0 && (
              <span className="bg-teal-500/20 text-teal-400 text-[9px] px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center">
                {tabResults.results.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'crypto'
                ? 'bg-slate-700/80 text-teal-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            Crypto
          </button>
        </div>
      </div>

      {activeTab === 'scanner' ? (
        <ScannerTab
          enabled={enabled}
          tabResults={tabResults}
          onToggle={handleToggle}
          onDecrypt={handleDecrypt}
        />
      ) : (
        <CryptoTab
          initialDecryptText={decryptText}
          onDecryptTextConsumed={() => setDecryptText(undefined)}
        />
      )}

      <div className="px-5 py-2 border-t border-slate-700/50 bg-slate-800/30">
        <p className="text-[10px] text-slate-500 text-center">
          Inspired by OrigamiVault -- Encrypted Paper Storage
        </p>
      </div>
    </div>
  );
}

export default App;
