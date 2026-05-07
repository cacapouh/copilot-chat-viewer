import type { ReactNode } from 'react';
import type { ChatRequest, ChatUserMessage, ResponseBlock } from '../types/chat';
import { basename, extractText, extractUriPath } from '../utils/extract';
import { ResponseBlockView } from './ResponseBlock';
import { Markdown } from './Markdown';

type Props = {
  request: ChatRequest;
  requesterName: string;
  responderName: string;
};

export function MessageItem({ request, requesterName, responderName }: Props) {
  const userText = readUserText(request.message);
  const blocks = Array.isArray(request.response) ? request.response : [];
  const chunks = mergeBlocks(blocks);

  return (
    <article className="border-t border-neutral-200 py-6 space-y-4">
      <Bubble role="user" name={requesterName}>
        {userText ? <Markdown source={userText} /> : <span className="italic text-neutral-400">（空のリクエスト）</span>}
      </Bubble>
      <Bubble role="assistant" name={responderName}>
        {chunks.length === 0 ? (
          <span className="italic text-neutral-400">（応答なし）</span>
        ) : (
          <div className="space-y-2 min-w-0">
            {chunks.map((c, i) =>
              c.kind === 'md' ? (
                <Markdown key={i} source={c.source} />
              ) : (
                <ResponseBlockView key={i} block={c.block} />
              ),
            )}
          </div>
        )}
      </Bubble>
    </article>
  );
}

function readUserText(message: ChatRequest['message']): string {
  if (!message) return '';
  if (typeof message === 'string') return message;
  return extractText((message as ChatUserMessage).text);
}

type Chunk =
  | { kind: 'md'; source: string }
  | { kind: 'block'; block: ResponseBlock };

// 連続する markdown テキスト系（kind 無し + value:string / kind: 'markdownContent'）
// と inlineReference を 1 ストリームに連結し、それ以外（thinking / tool / textEdit / mcp / unknown）
// はブロック単位で残す。inlineReference は markdown リンクに変換して埋め込む。
function mergeBlocks(blocks: ResponseBlock[]): Chunk[] {
  const result: Chunk[] = [];
  let buf = '';

  const flush = () => {
    if (buf) {
      result.push({ kind: 'md', source: buf });
      buf = '';
    }
  };

  for (const b of blocks) {
    const inline = blockToMarkdown(b);
    if (inline != null) {
      buf += inline;
    } else {
      flush();
      result.push({ kind: 'block', block: b });
    }
  }
  flush();
  return result;
}

function blockToMarkdown(block: ResponseBlock): string | null {
  if (block.kind === 'markdownContent') {
    return extractText((block as { content?: unknown }).content);
  }
  // VS Code の MarkdownString-like: kind 無し、value:string + baseUri/uris
  if (!block.kind && typeof (block as { value?: unknown }).value === 'string') {
    return extractText(block);
  }
  if (block.kind === 'inlineReference') {
    return inlineReferenceToMarkdown(block);
  }
  return null;
}

function inlineReferenceToMarkdown(block: ResponseBlock): string {
  // 2 パターン:
  //   シンボル参照: { name, location: { uri, range } }
  //   ファイル参照: { path, fsPath, external, scheme }（URI そのもの）
  const ref = (block as { inlineReference?: unknown }).inlineReference as
    | {
        name?: string;
        location?: { uri?: unknown; range?: { startLineNumber?: number } };
        external?: string;
      }
    | undefined;
  if (!ref) return '';

  let label: string;
  let url: string;
  let lineSuffix = '';

  if (ref.location) {
    const path = extractUriPath(ref.location.uri);
    const line = ref.location.range?.startLineNumber;
    label = ref.name || basename(path) || '参照';
    url = path ? `file://${path}${typeof line === 'number' ? `#L${line}` : ''}` : '';
    if (typeof line === 'number') lineSuffix = `:${line}`;
  } else {
    const path = extractUriPath(ref);
    label = basename(path) || '参照';
    url = ref.external || (path ? `file://${path}` : '');
  }

  const text = `\`${escapeBackticks(label)}${lineSuffix}\``;
  return url ? `[${text}](${url})` : text;
}

function escapeBackticks(s: string): string {
  return s.replace(/`/g, '\\`');
}

type BubbleProps = {
  role: 'user' | 'assistant';
  name: string;
  children: ReactNode;
};

function Bubble({ role, name, children }: BubbleProps) {
  const isUser = role === 'user';
  return (
    <div
      className={`rounded-lg border p-4 min-w-0 ${
        isUser ? 'bg-neutral-100 border-neutral-200' : 'bg-white border-neutral-200'
      }`}
    >
      <div
        className={`text-xs uppercase tracking-wide mb-2 ${
          isUser ? 'text-neutral-500' : 'text-accent'
        }`}
      >
        {name}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
