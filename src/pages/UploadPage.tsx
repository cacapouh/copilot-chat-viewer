import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatJson } from '../types/chat';
import type { Payload } from '../types/payload';

type ParseError = {
  message: string;
  line?: number;
  column?: number;
};

export function UploadPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<ParseError | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const text = await file.text();
        const parsed = parseChatJson(text);
        const payload: Payload = {
          v: 1,
          rawJson: parsed,
          title: file.name.replace(/\.json$/i, ''),
        };
        // ルートステートで View に渡す。URL は共有時にだけ生成する方針。
        navigate('/view', { state: { payload } });
      } catch (err) {
        setError(toParseError(err));
      } finally {
        setBusy(false);
      }
    },
    [navigate],
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Copilot Chat Viewer</h1>
        <p className="mt-2 text-neutral-600">
          VS Code の GitHub Copilot Chat エクスポート（<code className="font-mono text-sm">chat.json</code>）を
          ブラウザで整形表示し、共有 URL を発行します。
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          サーバ送信なし・ストレージなし。データは URL に圧縮埋め込みされます。
        </p>
      </header>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`block border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-300 hover:bg-neutral-50'
        }`}
      >
        <div className="text-lg font-medium">chat.json をドロップ</div>
        <div className="text-sm text-neutral-500 mt-1">またはクリックしてファイル選択</div>
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>

      {busy && <div className="mt-4 text-sm text-neutral-500">読み込み中...</div>}

      {error && (
        <div className="mt-4 border border-red-300 bg-red-50 text-red-800 rounded-md p-3 text-sm">
          <div className="font-semibold">JSON のパースに失敗しました</div>
          <div className="mt-1">{error.message}</div>
          {error.line != null && (
            <div className="mt-1 font-mono text-xs">
              line {error.line}
              {error.column != null ? `, column ${error.column}` : ''}
            </div>
          )}
        </div>
      )}

      <footer className="mt-12 text-xs text-neutral-400">
        共有 URL を受け取った人は、上のアップロード手順は不要です。URL を開けば中身がそのまま見えます。
      </footer>
    </div>
  );
}

function parseChatJson(text: string): ChatJson {
  try {
    const v = JSON.parse(text) as unknown;
    if (typeof v !== 'object' || v === null) {
      throw new Error('JSON のトップレベルがオブジェクトではありません');
    }
    return v as ChatJson;
  } catch (err) {
    if (err instanceof SyntaxError) {
      const loc = locateSyntaxError(text, err.message);
      throw Object.assign(new SyntaxError(err.message), loc);
    }
    throw err;
  }
}

function toParseError(err: unknown): ParseError {
  if (err instanceof Error) {
    const e = err as Error & { line?: number; column?: number };
    return { message: e.message, line: e.line, column: e.column };
  }
  return { message: String(err) };
}

// JSON.parse のエラーメッセージから可能な範囲で行/列を割り出す。
// ブラウザ実装ごとにメッセージ書式が違うので、取れたら出す程度の best effort。
function locateSyntaxError(text: string, message: string): { line?: number; column?: number } {
  const posMatch = message.match(/position\s+(\d+)/i);
  if (posMatch) {
    return offsetToLineCol(text, Number(posMatch[1]));
  }
  const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch) {
    return { line: Number(lineColMatch[1]), column: Number(lineColMatch[2]) };
  }
  return {};
}

function offsetToLineCol(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
      col = 1;
    } else {
      col += 1;
    }
  }
  return { line, column: col };
}
