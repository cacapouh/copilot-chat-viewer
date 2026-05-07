import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Payload } from '../types/payload';
import { decodePayload } from '../utils/encoding';
import { ChatView } from '../components/ChatView';

type LoadResult =
  | { kind: 'ok'; payload: Payload }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

export function ViewPage() {
  const location = useLocation();
  const [result, setResult] = useState<LoadResult | null>(null);

  // location.search は HashRouter 上では `?d=...` のフラグメント内クエリ。
  // location.state はアップロード画面から navigate で渡された場合のみ存在する。
  const encoded = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('d');
  }, [location.search]);

  const stateFromUpload = useMemo(() => {
    const s = location.state as { payload?: Payload } | null;
    return s?.payload;
  }, [location.state]);

  useEffect(() => {
    if (encoded) {
      try {
        const p = decodePayload(encoded);
        setResult({ kind: 'ok', payload: p });
      } catch (err) {
        setResult({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }
    if (stateFromUpload) {
      setResult({ kind: 'ok', payload: stateFromUpload });
      return;
    }
    setResult({ kind: 'empty' });
  }, [encoded, stateFromUpload]);

  if (!result) return null;

  if (result.kind === 'error') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold mb-2 text-fg">URL が壊れています</h1>
        <p className="text-sm text-fg-muted">
          共有データを復号できませんでした。URL が途中で切れている可能性があります。
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
