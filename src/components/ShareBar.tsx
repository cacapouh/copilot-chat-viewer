import { useState } from 'react';

type Props = {
  buildShareUrl: () => string;
};

export function ShareBar({ buildShareUrl }: Props) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'err'>('idle');
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  async function onShare() {
    const url = buildShareUrl();
    setLastUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied('ok');
    } catch {
      setCopied('err');
    }
    window.setTimeout(() => setCopied('idle'), 2500);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onShare}
          className="px-4 py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800 text-sm"
        >
          共有 URL を作成してコピー
        </button>
        {copied === 'ok' && <span className="text-xs text-emerald-700">コピーしました</span>}
        {copied === 'err' && (
          <span className="text-xs text-red-700">クリップボード書き込みに失敗しました。下の欄からコピーしてください</span>
        )}
      </div>
      {lastUrl && (
        <textarea
          readOnly
          value={lastUrl}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          className="w-full min-h-[80px] text-xs font-mono border border-neutral-300 rounded p-2 bg-white"
        />
      )}
    </div>
  );
}
