// chat.json の variant 吸収用。string か {value:string} のどちらでも来る箇所が多い。

export function extractText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const v = (value as { value?: unknown }).value;
    if (typeof v === 'string') return v;
    const text = (value as { text?: unknown }).text;
    if (typeof text === 'string') return text;
  }
  return '';
}

export function extractUriPath(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const o = value as { fsPath?: unknown; path?: unknown; external?: unknown };
    if (typeof o.fsPath === 'string') return o.fsPath;
    if (typeof o.path === 'string') return o.path;
    if (typeof o.external === 'string') return o.external;
  }
  return '';
}

export function basename(p: string): string {
  if (!p) return '';
  const norm = p.replace(/\\/g, '/');
  const idx = norm.lastIndexOf('/');
  return idx === -1 ? norm : norm.slice(idx + 1);
}
