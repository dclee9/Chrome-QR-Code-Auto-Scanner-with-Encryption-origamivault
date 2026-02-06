import { ScanLine } from 'lucide-react';
import Toggle from './Toggle';
import ScanResult from './ScanResult';

interface QrResult {
  data: string;
  imageUrl: string;
}

interface TabResults {
  results: QrResult[];
  imageCount: number;
  scanning: boolean;
}

interface ScannerTabProps {
  enabled: boolean;
  tabResults: TabResults;
  onToggle: (value: boolean) => void;
  onDecrypt: (data: string) => void;
}

export default function ScannerTab({ enabled, tabResults, onToggle, onDecrypt }: ScannerTabProps) {
  return (
    <>
      <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                enabled ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-xs text-slate-400">
              {enabled ? (tabResults.scanning ? 'Scanning...' : 'Active') : 'Paused'}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {tabResults.imageCount} image{tabResults.imageCount !== 1 ? 's' : ''} checked
          </span>
        </div>
        <div className="flex items-center gap-3">
          {tabResults.results.length > 0 && (
            <span className="text-xs font-medium text-teal-400">
              {tabResults.results.length} QR found
            </span>
          )}
          <Toggle enabled={enabled} onChange={onToggle} />
        </div>
      </div>

      <div className="max-h-[340px] overflow-y-auto">
        {tabResults.results.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <ScanLine className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {enabled
                ? 'No QR codes detected on this page'
                : 'Enable scanning to detect QR codes'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {enabled
                ? 'QR codes will appear here when found'
                : 'Toggle the switch above to start'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {tabResults.results.map((result, i) => (
              <ScanResult
                key={`${result.data}-${i}`}
                data={result.data}
                index={i}
                onDecrypt={onDecrypt}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
