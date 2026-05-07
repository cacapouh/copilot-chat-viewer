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
  const requesterName = initial.rawJson.requesterUsername || 'You';
  const responderName = initial.rawJson.responderUsername || 'GitHub Copilot';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">Copilot Chat Viewer</h1>
        <SizeIndicator bytes={urlLength} />
      </header>

      <section className="space-y-3 bg-white border border-neutral-200 rounded-lg p-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-neutral-500">タイトル</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="このチャットのタイトル"
            className="mt-1 w-full text-lg font-medium border-b border-neutral-300 py-1 focus:outline-none focus:border-neutral-900 bg-transparent"
          />
        </label>
      </section>

      <section className="bg-white border border-neutral-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">共有</h2>
        <ShareBar buildShareUrl={() => buildShareUrl(encodePayload(payload))} />
      </section>

      <section>
        {requests.length === 0 ? (
          <div className="text-neutral-500 text-sm border border-dashed border-neutral-300 rounded p-6 text-center">
            requests が見つかりませんでした。chat.json の構造を確認してください。
          </div>
        ) : (
          requests.map((req, i) => (
            <MessageItem
              key={i}
              request={req}
              requesterName={requesterName}
              responderName={responderName}
            />
          ))
        )}
      </section>
    </div>
  );
}
