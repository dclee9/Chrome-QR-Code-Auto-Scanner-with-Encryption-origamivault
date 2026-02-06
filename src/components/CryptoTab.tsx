import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertCircle,
  ImagePlus,
  X,
  ScanLine,
  Timer,
} from 'lucide-react';
import { encrypt, decrypt, generateKey } from '../utils/crypto';
import { readQrFromFile } from '../utils/qrReader';
import { saveKey, loadKey, clearKey, getExpiry, getRemainingMs } from '../utils/keyStore';

interface CryptoTabProps {
  initialDecryptText?: string;
  onDecryptTextConsumed?: () => void;
}

type Mode = 'encrypt' | 'decrypt';

const BASE64_RE = /^[A-Za-z0-9+/\n\r]+=*$/;
const MIN_CIPHER_LEN = 40;

function looksLikeCiphertext(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_CIPHER_LEN) return false;
  return BASE64_RE.test(trimmed);
}

function formatTimeLeft(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function CryptoTab({ initialDecryptText, onDecryptTextConsumed }: CryptoTabProps) {
  const [mode, setMode] = useState<Mode>(initialDecryptText ? 'decrypt' : 'encrypt');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputCopied, setOutputCopied] = useState(false);
  const [autoCopiedBanner, setAutoCopiedBanner] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrFileName, setQrFileName] = useState<string | null>(null);
  const [keyTimeLeft, setKeyTimeLeft] = useState<number | null>(null);
  const [keyLoaded, setKeyLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoDecryptRef = useRef(false);
  const lastAutoDecryptedRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExpiryTimer = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const expiry = await getExpiry();
    if (!expiry) {
      setKeyTimeLeft(null);
      return;
    }

    setKeyTimeLeft(getRemainingMs(expiry));

    timerRef.current = setInterval(async () => {
      const remaining = getRemainingMs(expiry);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setKeyTimeLeft(null);
        setKey('');
        await clearKey();
      } else {
        setKeyTimeLeft(remaining);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await loadKey();
      if (stored) {
        setKey(stored);
        await startExpiryTimer();
      }
      setKeyLoaded(true);
    })();
  }, [startExpiryTimer]);

  useEffect(() => {
    if (initialDecryptText) {
      setMode('decrypt');
      setInput(initialDecryptText);
      autoDecryptRef.current = true;
      onDecryptTextConsumed?.();
    }
  }, [initialDecryptText, onDecryptTextConsumed]);

  const runDecrypt = useCallback(async (ciphertext: string, password: string) => {
    setError('');
    setOutput('');
    setProcessing(true);
    try {
      const result = await decrypt(ciphertext.trim(), password);
      setOutput(result);
    } catch {
      setError('Decryption failed. Check your key and ciphertext.');
    } finally {
      setProcessing(false);
    }
  }, []);

  useEffect(() => {
    if (!keyLoaded) return;
    if (!autoDecryptRef.current) return;
    if (!key.trim() || !input.trim()) return;
    if (mode !== 'decrypt') return;

    autoDecryptRef.current = false;
    runDecrypt(input, key);
  }, [keyLoaded, key, input, mode, runDecrypt]);

  useEffect(() => {
    if (mode !== 'decrypt') return;
    if (!keyLoaded || !key.trim()) return;
    const trimmed = input.trim();
    if (!trimmed || trimmed === lastAutoDecryptedRef.current) return;
    if (!looksLikeCiphertext(trimmed)) return;

    lastAutoDecryptedRef.current = trimmed;
    runDecrypt(input, key);
  }, [mode, keyLoaded, key, input, runDecrypt]);

  const handleSaveKey = useCallback(async (newKey: string) => {
    setKey(newKey);
    setError('');
    if (newKey.trim()) {
      await saveKey(newKey);
      await startExpiryTimer();
    }
  }, [startExpiryTimer]);

  const handleClearKey = useCallback(async () => {
    setKey('');
    setKeyTimeLeft(null);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    await clearKey();
  }, []);

  const handleCopyKey = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleGenerateKey = async () => {
    const newKey = generateKey();
    await handleSaveKey(newKey);
    setShowKey(true);
  };

  const handleCopyOutput = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 2000);
  };

  const handleProcess = async () => {
    if (!key.trim()) {
      setError('Please enter an encryption key');
      return;
    }
    if (!input.trim()) {
      setError('Please enter text to ' + mode);
      return;
    }

    await handleSaveKey(key);

    setError('');
    setOutput('');
    setAutoCopiedBanner(false);
    setProcessing(true);

    try {
      if (mode === 'encrypt') {
        const result = await encrypt(input.trim(), key);
        setOutput(result);
        await navigator.clipboard.writeText(result);
        setAutoCopiedBanner(true);
        setTimeout(() => setAutoCopiedBanner(false), 3000);
      } else {
        const result = await decrypt(input.trim(), key);
        setOutput(result);
      }
    } catch {
      setError(
        mode === 'decrypt'
          ? 'Decryption failed. Check your key and ciphertext.'
          : 'Encryption failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === 'Enter' && mode === 'encrypt') {
      e.preventDefault();
      handleProcess();
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setOutput('');
    setQrLoading(true);
    setQrFileName(file.name);

    try {
      const data = await readQrFromFile(file);
      if (data) {
        setInput(data);
        if (key.trim()) {
          autoDecryptRef.current = true;
        }
      } else {
        setError('No QR code found in this image. Try a clearer image.');
        setQrFileName(null);
      }
    } catch {
      setError('Failed to read image file.');
      setQrFileName(null);
    } finally {
      setQrLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearQrFile = () => {
    setQrFileName(null);
    setInput('');
    setOutput('');
    setError('');
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setInput('');
    setOutput('');
    setError('');
    setQrFileName(null);
    lastAutoDecryptedRef.current = '';
  };

  return (
    <div className="px-4 py-3">
      <div className="flex rounded-lg bg-slate-800/80 p-0.5 mb-3">
        <button
          onClick={() => switchMode('encrypt')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'encrypt'
              ? 'bg-teal-500/20 text-teal-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Lock className="w-3 h-3" />
          Encrypt
        </button>
        <button
          onClick={() => switchMode('decrypt')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'decrypt'
              ? 'bg-teal-500/20 text-teal-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Unlock className="w-3 h-3" />
          Decrypt
        </button>
      </div>

      {mode === 'decrypt' && (
        <div className="mb-3">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <ScanLine className="w-3 h-3" /> Load from QR Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleQrUpload}
            className="hidden"
          />
          {qrFileName ? (
            <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/25 rounded-lg px-3 py-2">
              <ScanLine className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              <span className="text-xs text-teal-300 truncate flex-1">{qrFileName}</span>
              <button
                onClick={clearQrFile}
                className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={qrLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-slate-600 bg-slate-800/50 text-slate-400 hover:text-teal-300 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all text-xs"
            >
              {qrLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  Reading QR code...
                </>
              ) : (
                <>
                  <ImagePlus className="w-3.5 h-3.5" />
                  Upload QR code image
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Encryption Key
          </label>
          {keyTimeLeft !== null && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400/80">
              <Timer className="w-2.5 h-2.5" />
              <span>{formatTimeLeft(keyTimeLeft)}</span>
              <button
                onClick={handleClearKey}
                className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors"
                title="Clear saved key"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => handleSaveKey(e.target.value)}
              placeholder="Enter your encryption key..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-colors"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={handleCopyKey}
            disabled={!key}
            className="px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-teal-400 hover:border-teal-500/30 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-700 transition-colors"
            title="Copy key"
          >
            {keyCopied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {mode === 'encrypt' && (
            <button
              onClick={handleGenerateKey}
              className="px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
              title="Generate random key"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            {mode === 'encrypt' ? (
              <><ArrowDownToLine className="w-3 h-3" /> Plaintext</>
            ) : (
              <><ArrowUpFromLine className="w-3 h-3" /> Ciphertext</>
            )}
          </label>
          {mode === 'encrypt' && (
            <span className="text-[9px] text-slate-500">Shift+Enter to encrypt</span>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'encrypt' ? 'Text to encrypt...' : 'Paste encrypted text or upload a QR image above...'}
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-colors resize-none font-mono leading-relaxed"
        />
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={processing || !key.trim() || !input.trim()}
        className="w-full py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 hover:border-teal-500/50 active:scale-[0.98]"
      >
        {processing ? (
          <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        ) : mode === 'encrypt' ? (
          <Lock className="w-3.5 h-3.5" />
        ) : (
          <Unlock className="w-3.5 h-3.5" />
        )}
        {processing ? 'Processing...' : mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
      </button>

      {autoCopiedBanner && (
        <div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/25 text-xs text-teal-300 animate-fade-in">
          <Check className="w-3.5 h-3.5" />
          Copied to clipboard
        </div>
      )}

      {output && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {mode === 'encrypt' ? 'Encrypted Output' : 'Decrypted Message'}
            </label>
            <button
              onClick={handleCopyOutput}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-teal-400 transition-colors"
            >
              {outputCopied ? (
                <><Check className="w-3 h-3 text-teal-400" /> Copied</>
              ) : (
                <><Copy className="w-3 h-3" /> Copy</>
              )}
            </button>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono break-all leading-relaxed max-h-[100px] overflow-y-auto">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
