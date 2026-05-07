// Node から URL フラグメントの往復が無損失か確認するスモークテスト。
// ブラウザ環境を模擬しつつ encoding.ts と等価な実装を呼ぶ。
import pako from 'pako';

const sample = {
  v: 1,
  rawJson: {
    requesterUsername: 'alice',
    responderUsername: 'GitHub Copilot',
    requests: [
      {
        message: { text: 'Hello, world?' },
        response: [
          { kind: 'markdownContent', content: '# Hello\n\nThis is *markdown*.' },
          {
            kind: 'textEditGroup',
            uri: { fsPath: '/tmp/foo.ts' },
            edits: [{ range: [1, 2], newText: 'foo' }],
          },
          { kind: 'toolInvocation', toolName: 'read_file', invocationMessage: 'Reading foo.ts' },
          { kind: 'mysteryKindFromFutureVscode', payload: { ok: true } },
        ],
      },
      {
        message: 'もう一つの質問',
        response: [{ kind: 'markdownContent', content: { value: 'plain string variant' } }],
      },
    ],
  },
  title: 'smoke test sample',
};

function bytesToBase64Url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return Buffer.from(s, 'binary')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBytes(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return new Uint8Array(Buffer.from(b64 + pad, 'base64'));
}

const json = JSON.stringify(sample);
const utf8 = new TextEncoder().encode(json);
const gz = pako.gzip(utf8);
const enc = bytesToBase64Url(gz);

console.log('original JSON bytes :', utf8.length);
console.log('gzip bytes          :', gz.length);
console.log('base64url chars     :', enc.length);
console.log('full URL approx     :', `http://localhost:5173/#/view?d=${enc}`.length);

const dec = JSON.parse(new TextDecoder().decode(pako.ungzip(base64UrlToBytes(enc))));
const ok = JSON.stringify(dec) === JSON.stringify(sample);
console.log('round-trip lossless :', ok);
if (!ok) {
  console.error('mismatch');
  process.exit(1);
}
