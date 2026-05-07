import { useState } from 'react';
import { SHORT_LINK_ENABLED, createShortLink } from '../utils/encoding';

type Props = {
  buildShareUrl: () => string;
  getEncoded: () => string;
  className?: string;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'ok'; message: string }
  | { kind: 'err'; message: string }
  | { kind: 'loading' };

// 入力欄っぽさを排した、通常のボタン + URL 表示。
// "テキストを書きたくなる" 形にならないよう placeholder / 大きな空エリアは持たせない。
export function ShareBar({ buildShareUrl, getEncoded, className }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  async function copy(url: string, okMsg: string) {
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ kind: 'ok', message: okMsg });
    } catch {
      setStatus({ kind: 'err', message: 'コピー失敗・下の欄から手動でコピーしてください' });
    }
    window.setTimeout(() => setStatus({ kind: 'idle' }), 2500);
  }

  async function onShareLong() {
    const url = buildShareUrl();
    setLastUrl(url);
    await copy(url, 'コピーしました');
  }

  async function onShareShort() {
    setStatus({ kind: 'loading' });
    try {
      const url = await createShortLink(getEncoded());
      setLastUrl(url);
      await copy(url, 'ショートリンクをコピーしました');
    } catch (err) {
      setStatus({
        kind: 'err',
        message: err instanceof Error ? err.message : 'ショートリンク作成に失敗しました',
      });
      window.setTimeout(() => setStatus({ kind: 'idle' }), 3500);
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onShareLong}
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
        {SHORT_LINK_ENABLED && (
          <button
            type="button"
            onClick={onShareShort}
            disabled={status.kind === 'loading'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-chip border border-line text-fg-muted hover:text-fg hover:bg-bg-elev text-[12px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.5 9.5a2.5 2.5 0 0 0 3.54 0l2-2a2.5 2.5 0 1 0-3.54-3.54l-.5.5M9.5 6.5a2.5 2.5 0 0 0-3.54 0l-2 2a2.5 2.5 0 1 0 3.54 3.54l.5-.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {status.kind === 'loading' ? '作成中…' : 'ショートリンクをコピー'}
          </button>
        )}
        {status.kind === 'ok' && <span className="text-[12px] text-emerald-400">{status.message}</span>}
        {status.kind === 'err' && <span className="text-[12px] text-rose-400">{status.message}</span>}
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
