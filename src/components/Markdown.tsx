import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

type Props = {
  source: string;
};

// chat 内コンテンツ・アノテーション両方で使う共通の Markdown レンダラ。
export function Markdown({ source }: Props) {
  return (
    <div className="prose-chat max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
