import type { ChatRequest, ChatUserMessage, ResponseBlock } from '../types/chat';
import { basename, extractText, extractUriPath } from '../utils/extract';
import { ResponseBlockView } from './ResponseBlock';
import { Markdown } from './Markdown';

type Props = {
  request: ChatRequest;
};

export function MessageItem({ request }: Props) {
  const userText = readUserText(request.message);
  const blocks = Array.isArray(request.response) ? request.response : [];
  const chunks = mergeBlocks(blocks);

  return (
    <article className="py-5 space-y-4">
      <UserMessage text={userText} />
      <AssistantMessage chunks={chunks} />
    </article>
  );
}

function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] bg-[#363636] text-fg rounded-2xl px-3.5 py-2 text-[14px] leading-snug min-w-0">
        {text ? (
          <div className="prose-chat prose-chat--compact">
            <Markdown source={text} />
          </div>
        ) : (
          <span className="italic text-fg-dim">（空のリクエスト）</span>
        )}
      </div>
    </div>
  );
}

function AssistantMessage({ chunks }: { chunks: Chunk[] }) {
  if (chunks.length === 0) {
    return <div className="italic text-fg-dim text-sm">（応答なし）</div>;
  }
  return (
    <div className="space-y-1 min-w-0">
      {chunks.map((c, i) =>
        c.kind === 'md' ? (
          <div key={i} className="prose-chat min-w-0">
            <Markdown source={c.source} />
          </div>
        ) : (
          <ResponseBlockView key={i} block={c.block} />
        ),
      )}
    </div>
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
