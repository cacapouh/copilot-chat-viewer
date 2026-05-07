import { useState } from 'react';

type Props = {
  buildShareUrl: () => string;
  className?: string;
};

// 入力欄っぽさを排した、通常のボタン + URL 表示。
// "テキストを書きたくなる" 形にならないよう placeholder / 大きな空エリアは持たせない。
export function ShareBar({ buildShareUrl, className }: Props) {
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
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-chip border border-line text-fg-muted hover:text-fg hover:bg-bg-elev text-[12px]"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11 5.5 5 9m0-2L11 10.5M5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9-4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          共有 URL をコピー
        </button>
        {copied === 'ok' && <span className="text-[12px] text-emerald-400">コピーしました</span>}
        {copied === 'err' && (
          <span className="text-[12px] text-rose-400">コピー失敗・下の欄から手動でコピーしてください</span>
        )}
      </div>
      {lastUrl && (
        <textarea
          readOnly
          value={lastUrl}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          aria-label="生成された共有 URL"
          className="mt-2 w-full min-h-[60px] max-h-[140px] text-[12px] font-mono bg-bg-elev border border-line-subtle text-fg rounded-md p-2 resize-none focus:outline-none focus:border-line"
        />
      )}
    </div>
  );
}
