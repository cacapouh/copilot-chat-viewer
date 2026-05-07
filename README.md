# Copilot Chat Viewer

VS Code GitHub Copilot Chat のエクスポート（`chat.json`）を、ブラウザだけで整形表示して共有 URL を発行するアプリ。

- サーバなし／ストレージなし／ログインなし
- 全データ（chat.json + タイトル）は **gzip + base64url で URL のフラグメントに埋め込まれる**
- フラグメントはサーバに送信されないため、静的ホスティング側で内容を見られる経路はない

## 起動

```sh
docker compose up
```

起動後、ブラウザで http://localhost:5173 を開く。

ホスト側でソースを編集すると Vite の HMR が走る（ポーリング有効）。

## 使い方

1. トップ画面で `chat.json` を D&D もしくはファイル選択
2. ビュー画面で必要ならタイトルを編集
3. 「共有 URL を作成してコピー」を押す
4. 受け手はその URL を開くだけ。アップロード操作は不要

URL の現在サイズはヘッダー隅に常時表示される（参考情報）。

## 応答ブロックの表示

`response[]` の各要素は `kind` で分岐する。連続する本文系（`markdownContent` / kind 無しの `MarkdownString` / `inlineReference`）は 1 ストリームに連結し、`inlineReference` は `[\`name:line\`](file:///...)` の markdown リンクに変換して埋め込む。

| kind | 表示 |
|---|---|
| `markdownContent` / kind 無し `{value}` | Markdown としてそのまま描画 |
| `inlineReference` | コードチップ＋リンクとして本文に inline 連結 |
| `thinking` | 折りたたみ。展開で Markdown 描画 |
| `toolInvocation` / `toolInvocationSerialized` | ツール名チップ + `pastTenseMessage` |
| `textEditGroup` | ファイル名と編集件数のサマリ。展開で生 JSON |
| `mcpServersStarting` | 控えめなインフォ行 |
| 未知 `kind` | 「未対応ブロック」として `<details>` で生 JSON を可視化 |

## ビルド（静的成果物の生成）

```sh
docker compose run --rm viewer npm run build
```

`dist/` 以下が成果物。`file://` で `dist/index.html` を開いても動く（HashRouter / `base: './'` のため）。

## ディレクトリ構成

```
src/
  pages/
    UploadPage.tsx   # / ルート (D&D 取り込み)
    ViewPage.tsx     # /view ルート (URL 復元 or アップロード後の表示)
  components/
    ChatView.tsx     # タイトル編集 + 共有 + メッセージ一覧
    MessageItem.tsx  # 1 リクエスト＋応答ペア。本文 + inlineReference の連結処理
    ResponseBlock.tsx# 連結ストリームに含めない kind 用 (thinking / tool / textEdit / mcp / unknown)
    ShareBar.tsx
    SizeIndicator.tsx
    Markdown.tsx
  utils/
    encoding.ts      # gzip + base64url + URL 構築
    sizeLevel.ts     # バイト数 → 表示文字列
    extract.ts       # variant 吸収（string | {value} 等、URI / basename）
  types/
    chat.ts          # chat.json の最小型 (未知フィールドは unknown)
    payload.ts       # 共有データ (v / rawJson / title)
```

## 既知の限界

- Shiki ではなく highlight.js を使用。ハイライト品質より導入の単純さを優先
- 巨大 chat.json では毎キー入力ごとの再エンコードが重くなる可能性。気になれば `useMemo` 側で debounce する
