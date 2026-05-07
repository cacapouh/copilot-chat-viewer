import { useState } from 'react';
import type { ResponseBlock } from '../types/chat';
import { extractText, extractUriPath, basename } from '../utils/extract';
import { Markdown } from './Markdown';

type Props = {
  block: ResponseBlock;
};

// markdownContent / kind 無し MarkdownString / inlineReference は MessageItem の連結処理側で
// 1 ストリームに合流させてあるので、このコンポーネントには来ない。
// ここでは単独ブロックとして見せたい kind だけ扱う。
export function ResponseBlockView({ block }: Props) {
  switch (block.kind) {
    case 'textEditGroup':
      return <TextEditBlock block={block} />;
    case 'toolInvocation':
    case 'toolInvocationSerialized':
      return <ToolInvocationView block={block} />;
    case 'thinking':
      return <ThinkingView block={block} />;
    case 'mcpServersStarting':
      return <McpServersStartingView block={block} />;
    case 'progressTask':
    case 'progressTaskSerialized':
      return <ProgressTaskView block={block} />;
    default:
      return <UnknownKindView block={block} />;
  }
}

// Copilot Chat 風の細い 1 行: 小さいファイルアイコン + past-tense メッセージ。
// VS Code 由来の `[](file:///...)` 形式（リンクラベル空）が混じるので、
// それは描画前に basename のインラインコードに変換する。
function ToolInvocationView({ block }: { block: ResponseBlock }) {
  const b = block as {
    toolName?: string;
    toolId?: string;
    invocationMessage?: unknown;
    pastTenseMessage?: unknown;
  };
  const raw = extractText(b.pastTenseMessage) || extractText(b.invocationMessage);
  const message = raw ? rewriteEmptyLinkLabels(raw) : '';
  const fallback = b.toolName || b.toolId;

  return (
    <div className="flex items-start gap-2 my-1 text-[13px] text-fg-muted min-w-0">
      <span className="mt-[3px] shrink-0">
        <FileIcon />
      </span>
      {message ? (
        <div className="prose-chat prose-chat--compact min-w-0 flex-1 [&_p]:!my-0 [&_p]:!leading-relaxed [&_code]:bg-bg-chip [&_code]:text-fg [&_code]:border [&_code]:border-line-subtle [&_code]:px-[5px] [&_code]:py-[1px] [&_code]:rounded-md [&_a]:text-fg-muted [&_a]:no-underline">
          <Markdown source={message} />
        </div>
      ) : fallback ? (
        <span className="font-mono text-[12.5px] text-fg-dim">{fallback}</span>
      ) : null}
    </div>
  );
}

// `[](file:///path/to/foo.ts)` のような空ラベルリンクを
// `` `foo.ts` `` （basename のインラインコード）に置換する。
// 既にラベルが入っている `[name](uri)` はそのまま。
function rewriteEmptyLinkLabels(md: string): string {
  return md.replace(/\[\]\(([^)\s]+)\)/g, (_match, urlRaw: string) => {
    let url = urlRaw;
    try {
      url = decodeURIComponent(url);
    } catch {
      // 失敗してもフォールバックで処理する
    }
    const path = url.replace(/^file:\/\/+/, '/').replace(/^[a-z]+:\/\//, '');
    const name = basename(path) || path;
    return name ? `\`${name}\`` : '';
  });
}

function TextEditBlock({ block }: { block: ResponseBlock }) {
  const [open, setOpen] = useState(false);
  const path = extractUriPath((block as { uri?: unknown }).uri);
  const fileName = basename(path) || '(unknown file)';
  const edits = (block as { edits?: unknown[] }).edits ?? [];
  const editCount = Array.isArray(edits) ? edits.length : 0;

  return (
    <div className="my-2 text-[13px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 text-left text-fg-muted hover:text-fg group"
      >
        <span className="text-fg-dim text-[10px] w-3 shrink-0">{open ? '▾' : '▸'}</span>
        <span className="text-fg-muted shrink-0">Edited</span>
        <span className="inline-flex items-center gap-1 px-2 py-[1px] rounded-md bg-bg-chip border border-line-subtle text-fg font-mono text-[12px] min-w-0">
          <FileIcon />
          <span className="truncate" title={path}>
            {fileName}
          </span>
        </span>
        <span className="text-fg-dim text-[12px] shrink-0">{editCount} 件の編集</span>
      </button>
      {open && (
        <pre className="mt-2 ml-5 px-3 py-2 text-[12px] overflow-x-auto bg-[#1a1a1a] border border-line-subtle rounded-md text-fg-muted">
          {JSON.stringify({ uri: path, edits }, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ThinkingView({ block }: { block: ResponseBlock }) {
  const text = extractText((block as { value?: unknown }).value);
  if (!text) return null;
  return (
    <details className="my-2 text-[13px] group">
      <summary className="cursor-pointer flex items-center gap-2 text-fg-muted hover:text-fg select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="text-fg-dim text-[10px] w-3 shrink-0 group-open:rotate-90 transition-transform">▸</span>
        <span className="text-fg-muted shrink-0 italic">Thinking</span>
        <span className="text-fg-dim truncate">{summarize(text, 80)}</span>
      </summary>
      <div className="mt-2 ml-5 pl-3 border-l-2 border-line-subtle text-fg-muted">
        <div className="prose-chat min-w-0">
          <Markdown source={text} />
        </div>
      </div>
    </details>
  );
}

function ProgressTaskView({ block }: { block: ResponseBlock }) {
  const b = block as { content?: unknown; progress?: unknown };
  const label = extractText(b.content);
  const progress = Array.isArray(b.progress) ? b.progress : [];

  if (!label && progress.length === 0) return null;

  if (progress.length === 0) {
    return (
      <div className="my-1 text-[13px] text-fg-dim italic">
        {label || '(no message)'}
      </div>
    );
  }
  return (
    <details className="my-2 text-[13px] group">
      <summary className="cursor-pointer flex items-center gap-2 text-fg-muted hover:text-fg select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="text-fg-dim text-[10px] w-3 shrink-0 group-open:rotate-90 transition-transform">▸</span>
        <span className="italic">{label || 'Progress'}</span>
        <span className="text-fg-dim text-[12px]">{progress.length} 件</span>
      </summary>
      <ul className="mt-2 ml-5 pl-3 border-l-2 border-line-subtle text-fg-muted space-y-1">
        {progress.map((item, i) => {
          const text = extractText(item);
          return (
            <li key={i} className="text-[12.5px]">
              {text || <span className="font-mono text-fg-dim">{JSON.stringify(item)}</span>}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function McpServersStartingView({ block }: { block: ResponseBlock }) {
  const ids = (block as { didStartServerIds?: unknown }).didStartServerIds;
  const idList = Array.isArray(ids) ? (ids as unknown[]).filter((x) => typeof x === 'string') : [];
  return (
    <div className="my-1 text-[13px] text-fg-dim italic">
      {idList.length === 0
        ? 'MCP サーバの起動なし'
        : `MCP サーバ起動: ${idList.join(', ')}`}
    </div>
  );
}

function UnknownKindView({ block }: { block: ResponseBlock }) {
  return (
    <details className="my-2 text-[13px]">
      <summary className="cursor-pointer flex items-center gap-2 text-amber-400/80 hover:text-amber-300 select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="text-[10px] w-3 shrink-0">▸</span>
        <span>未対応ブロック (kind: <span className="font-mono">{block.kind || '(none)'}</span>)</span>
      </summary>
      <pre className="mt-2 ml-5 px-3 py-2 text-[12px] overflow-x-auto bg-[#1a1a1a] border border-line-subtle rounded-md text-fg-muted">
        {JSON.stringify(block, null, 2)}
      </pre>
    </details>
  );
}

function FileIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-fg-dim"
      aria-hidden
    >
      <path
        d="M3 2h6l4 4v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function summarize(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length <= max ? oneLine : oneLine.slice(0, max) + '…';
}
