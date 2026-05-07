import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Payload } from '../types/payload';
import { SHORT_LINK_ENABLED, decodePayload, fetchShortLink } from '../utils/encoding';
import { ChatView } from '../components/ChatView';

type LoadResult =
  | { kind: 'ok'; payload: Payload }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

export function ViewPage() {
  const location = useLocation();
  const [result, setResult] = useState<LoadResult | null>(null);

  // location.search は HashRouter 上では `?d=...` または `?s=...` のフラグメント内クエリ。
  // location.state はアップロード画面から navigate で渡された場合のみ存在する。
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const encoded = params.get('d');
  const shortId = params.get('s');

  const stateFromUpload = useMemo(() => {
    const s = location.state as { payload?: Payload } | null;
    return s?.payload;
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;
    function applyEncoded(enc: string) {
      try {
        const p = decodePayload(enc);
        if (!cancelled) setResult({ kind: 'ok', payload: p });
      } catch (err) {
        if (!cancelled) {
          setResult({
            kind: 'error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    if (shortId) {
      if (!SHORT_LINK_ENABLED) {
        setResult({
          kind: 'error',
          message:
            'このデプロイではショートリンク機能が無効です。元の長い共有 URL (?d=...) を使ってください。',
        });
        return () => {
          cancelled = true;
        };
      }
      setResult(null);
      fetchShortLink(shortId)
        .then((enc) => {
          if (!cancelled) applyEncoded(enc);
        })
        .catch((err) => {
          if (!cancelled) {
            setResult({
              kind: 'error',
              message: err instanceof Error ? err.message : String(err),
            });
          }
        });
      return () => {
        cancelled = true;
      };
    }
    if (encoded) {
      applyEncoded(encoded);
      return () => {
        cancelled = true;
      };
    }
    if (stateFromUpload) {
      setResult({ kind: 'ok', payload: stateFromUpload });
      return () => {
        cancelled = true;
      };
    }
    setResult({ kind: 'empty' });
    return () => {
      cancelled = true;
    };
  }, [encoded, shortId, stateFromUpload]);

  if (!result) return null;

  if (result.kind === 'error') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold mb-2 text-fg">表示できませんでした</h1>
        <p className="text-sm text-fg-muted">
          共有データを取得・復号できませんでした。URL が途中で切れているか、ショートリンクが期限切れ・未登録の可能性があります。
        </p>
        <pre className="mt-3 text-xs bg-bg-elev border border-line-subtle text-fg-muted p-3 rounded overflow-x-auto">{result.message}</pre>
        <Link to="/" className="inline-block mt-6 text-sm text-accent underline">
          アップロード画面に戻る
        </Link>
      </div>
    );
  }

  if (result.kind === 'empty') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold mb-2 text-fg">表示するデータがありません</h1>
        <p className="text-sm text-fg-muted">
          URL のフラグメントが空で、アップロードもされていません。
        </p>
        <Link to="/" className="inline-block mt-6 text-sm text-accent underline">
          アップロード画面に戻る
        </Link>
      </div>
    );
  }

  return <ChatView initial={result.payload} />;
}
