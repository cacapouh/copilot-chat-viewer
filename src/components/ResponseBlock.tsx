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
    default:
      return <UnknownKindView block={block} />;
  }
}

function TextEditBlock({ block }: { block: ResponseBlock }) {
  const [open, setOpen] = useState(false);
  const path = extractUriPath((block as { uri?: unknown }).uri);
  const fileName = basename(path) || '(unknown file)';
  const edits = (block as { edits?: unknown[] }).edits ?? [];
  const editCount = Array.isArray(edits) ? edits.length : 0;

  return (
    <div className="border border-neutral-200 rounded-md bg-neutral-50 my-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-100"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="inline-block px-2 py-[1px] rounded bg-neutral-800 text-white text-xs font-mono shrink-0">
            edit
          </span>
          <span className="font-mono truncate" title={path}>
            {fileName}
          </span>
          <span className="text-neutral-500 text-xs shrink-0">{editCount} 件の編集</span>
        </span>
        <span className="text-neutral-400 text-xs shrink-0">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <pre className="px-3 pb-3 text-xs overflow-x-auto text-neutral-700">
          {JSON.stringify({ uri: path, edits }, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ToolInvocationView({ block }: { block: ResponseBlock }) {
  const b = block as {
    toolName?: string;
    toolId?: string;
    invocationMessage?: unknown;
    pastTenseMessage?: unknown;
    input?: unknown;
  };
  const name = b.toolName ?? b.toolId ?? 'tool';
  const message = extractText(b.pastTenseMessage) || extractText(b.invocationMessage);
  return (
    <div className="my-2 inline-flex items-start gap-2 max-w-full">
      <span className="inline-block px-2 py-[1px] rounded bg-blue-100 text-blue-800 border border-blue-200 text-xs font-mono shrink-0">
        {name}
      </span>
      {message && <span className="text-sm text-neutral-700">{message}</span>}
    </div>
  );
}

function ThinkingView({ block }: { block: ResponseBlock }) {
  const text = extractText((block as { value?: unknown }).value);
  if (!text) return null;
  return (
    <details className="my-2 border border-neutral-200 rounded-md bg-neutral-50 text-sm">
      <summary className="cursor-pointer px-3 py-2 text-neutral-600 select-none">
        <span className="inline-block px-2 py-[1px] mr-2 rounded bg-neutral-200 text-neutral-700 text-xs font-mono">
          thinking
        </span>
        <span className="text-neutral-500">{summarize(text, 80)}</span>
      </summary>
      <div className="px-3 pb-3 pt-1 text-neutral-700">
        <Markdown source={text} />
      </div>
    </details>
  );
}

function McpServersStartingView({ block }: { block: ResponseBlock }) {
  const ids = (block as { didStartServerIds?: unknown }).didStartServerIds;
  const idList = Array.isArray(ids) ? (ids as unknown[]).filter((x) => typeof x === 'string') : [];
  return (
    <div className="my-2 text-xs text-neutral-500 flex items-center gap-2">
      <span className="inline-block px-2 py-[1px] rounded bg-neutral-100 text-neutral-600 border border-neutral-200 font-mono">
        mcp
      </span>
      <span>
        {idList.length === 0
          ? 'MCP サーバの起動なし'
          : `MCP サーバ起動: ${idList.join(', ')}`}
      </span>
    </div>
  );
}

function UnknownKindView({ block }: { block: ResponseBlock }) {
  return (
    <details className="my-2 border border-amber-300 rounded-md bg-amber-50 p-2 text-sm">
      <summary className="cursor-pointer text-amber-800">
        未対応ブロック (kind: <span className="font-mono">{block.kind || '(none)'}</span>)
      </summary>
      <pre className="mt-2 text-xs overflow-x-auto text-neutral-700">
        {JSON.stringify(block, null, 2)}
      </pre>
    </details>
  );
}

function summarize(text: string, max: number): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length <= max ? oneLine : oneLine.slice(0, max) + '…';
}
