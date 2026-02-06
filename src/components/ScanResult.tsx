import { useState } from 'react';
import { Copy, Check, ExternalLink, KeyRound, Unlock } from 'lucide-react';

interface ScanResultProps {
  data: string;
  index: number;
  onDecrypt?: (data: string) => void;
}

function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

function looksEncrypted(text: string): boolean {
  if (text.length < 40) return false;
  try {
    const decoded = atob(text);
    return decoded.length >= 29;
  } catch {
    return false;
  }
}

export default function ScanResult({ data, index, onDecrypt }: ScanResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const url = isUrl(data) ? data : null;
  const encrypted = looksEncrypted(data);

  return (
    <div className="px-5 py-3 hover:bg-slate-800/50 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-medium text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded">
              QR #{index + 1}
            </span>
            {url && (
              <span className="text-[10px] text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded">
                URL
              </span>
            )}
            {encrypted && (
              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                Encrypted
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 break-all line-clamp-3 leading-relaxed font-mono">
            {data}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {url && (
            <button
              onClick={() => chrome.tabs.create({ url })}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-sky-400 transition-colors"
              title="Open URL"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-teal-400 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
      {encrypted && onDecrypt && (
        <button
          onClick={() => onDecrypt(data)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/35 transition-all active:scale-[0.98]"
        >
          <Unlock className="w-3 h-3" />
          Decrypt with saved key
        </button>
      )}
    </div>
  );
}
