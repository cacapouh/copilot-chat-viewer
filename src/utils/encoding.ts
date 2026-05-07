import pako from 'pako';
import type { Payload } from '../types/payload';

// base64url <-> Uint8Array
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodePayload(payload: Payload): string {
  const json = JSON.stringify(payload);
  const utf8 = new TextEncoder().encode(json);
  const gz = pako.gzip(utf8);
  return bytesToBase64Url(gz);
}

export function decodePayload(encoded: string): Payload {
  const gz = base64UrlToBytes(encoded);
  const utf8 = pako.ungzip(gz);
  const json = new TextDecoder().decode(utf8);
  const parsed = JSON.parse(json) as Payload;
  if (parsed.v !== 1) {
    throw new Error(`未知のスキーマバージョン: ${String(parsed.v)}`);
  }
  return parsed;
}

// 共有 URL を組み立てる。HashRouter 使用なので /#/view... 形式。
export function buildShareUrl(encoded: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/view?d=${encoded}`;
}

export function buildShortShareUrl(id: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/view?s=${id}`;
}

export function estimateUrlLength(encoded: string): number {
  return buildShareUrl(encoded).length;
}

// バックエンド (server/index.js) のあるデプロイでのみ有効。
// GitHub Pages のような静的ホスティングでは VITE_ENABLE_SHORT_LINK=false でビルドして無効化する。
export const SHORT_LINK_ENABLED = import.meta.env.VITE_ENABLE_SHORT_LINK !== 'false';

export async function createShortLink(encoded: string): Promise<string> {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encoded }),
  });
  if (!res.ok) {
    throw new Error(`ショートリンク作成に失敗しました (${res.status})`);
  }
  const data = (await res.json()) as { id: string };
  return buildShortShareUrl(data.id);
}

export async function fetchShortLink(id: string): Promise<string> {
  const res = await fetch(`/api/share/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    throw new Error('指定された ID は見つかりませんでした');
  }
  if (!res.ok) {
    throw new Error(`ショートリンク取得に失敗しました (${res.status})`);
  }
  const data = (await res.json()) as { encoded: string };
  return data.encoded;
}
