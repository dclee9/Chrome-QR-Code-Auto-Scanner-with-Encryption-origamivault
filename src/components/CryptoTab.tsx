import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { encrypt, decrypt, generateKey } from '../utils/crypto';

interface CryptoTabProps {
  initialDecryptText?: string;
  onDecryptTextConsumed?: () => void;
}

type Mode = 'encrypt' | 'decrypt';

export default function CryptoTab({ initialDecryptText, onDecryptTextConsumed }: CryptoTabProps) {
  const [mode, setMode] = useState<Mode>(initialDecryptText ? 'decrypt' : 'encrypt');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputCopied, setOutputCopied] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (initialDecryptText) {
      setMode('decrypt');
      setInput(initialDecryptText);
      onDecryptTextConsumed?.();
    }
  }, [initialDecryptText, onDecryptTextConsumed]);

  const handleCopyKey = async () => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleGenerateKey = () => {
    setKey(generateKey());
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

    setError('');
    setOutput('');
    setProcessing(true);

    try {
      if (mode === 'encrypt') {
        const result = await encrypt(input.trim(), key);
        setOutput(result);
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

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setInput('');
    setOutput('');
    setError('');
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

      <div className="mb-3">
        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
          Encryption Key
        </label>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
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
          <button
            onClick={handleGenerateKey}
            className="px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
            title="Generate random key"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          {mode === 'encrypt' ? (
            <><ArrowDownToLine className="w-3 h-3" /> Plaintext</>
          ) : (
            <><ArrowUpFromLine className="w-3 h-3" /> Ciphertext</>
          )}
        </label>
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          placeholder={mode === 'encrypt' ? 'Text to encrypt...' : 'Paste encrypted text here...'}
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

      {output && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {mode === 'encrypt' ? 'Encrypted Output' : 'Decrypted Output'}
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
