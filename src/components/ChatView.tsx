import { useMemo, useState } from 'react';
import type { Payload } from '../types/payload';
import { buildShareUrl, encodePayload, estimateUrlLength } from '../utils/encoding';
import { MessageItem } from './MessageItem';
import { ShareBar } from './ShareBar';
import { SizeIndicator } from './SizeIndicator';

type Props = {
  initial: Payload;
};

export function ChatView({ initial }: Props) {
  const [title, setTitle] = useState(initial.title);

  const payload: Payload = useMemo(
    () => ({
      v: 1,
      rawJson: initial.rawJson,
      title,
    }),
    [initial.rawJson, title],
  );

  const encoded = useMemo(() => encodePayload(payload), [payload]);
  const urlLength = useMemo(() => estimateUrlLength(encoded), [encoded]);

  const requests = Array.isArray(initial.rawJson.requests) ? initial.rawJson.requests : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* 上部の細いヘッダーバー */}
      <div className="border-b border-line-subtle bg-bg-elev">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-5 text-[11px] tracking-[0.12em] uppercase h-9">
          <span className="text-fg border-b-2 border-accent h-9 flex items-center -mb-px">
            Chat
          </span>
          <span className="ml-auto">
            <SizeIndicator bytes={urlLength} />
          </span>
        </div>
      </div>

      {/* タイトル + シェア */}
      <div className="max-w-3xl w-full mx-auto px-4 pt-5 pb-3 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="このチャットのタイトル"
          aria-label="チャットタイトル"
          className="w-full text-[15px] font-medium bg-transparent text-fg placeholder:text-fg-dim focus:outline-none"
        />
        <ShareBar buildShareUrl={() => buildShareUrl(encodePayload(payload))} />
      </div>

      {/* 会話本体 */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pb-12">
        {requests.length === 0 ? (
          <div className="text-fg-muted text-sm border border-dashed border-line rounded p-6 text-center mt-6">
            requests が見つかりませんでした。chat.json の構造を確認してください。
          </div>
        ) : (
          <div className="divide-y divide-line-subtle">
            {requests.map((req, i) => (
              <MessageItem key={i} request={req} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
