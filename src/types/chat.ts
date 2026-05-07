// VS Code Copilot Chat の export 形式は version によって変動する。
// ここでは "知らないフィールドは unknown で受けて narrowing する" 方針。

export type ChatJson = {
  requesterUsername?: string;
  responderUsername?: string;
  requests?: ChatRequest[];
  // export 形式変動への保険
  [key: string]: unknown;
};

export type ChatRequest = {
  message?: ChatUserMessage | string;
  response?: ResponseBlock[];
  // 一部 version で result/contentReferences など別フィールドあり
  [key: string]: unknown;
};

export type ChatUserMessage = {
  text?: string;
  parts?: unknown[];
  [key: string]: unknown;
};

// kind ごとに narrowing するためのユニオン
export type ResponseBlock =
  | MarkdownContentBlock
  | TextEditGroupBlock
  | ToolInvocationBlock
  | UnknownBlock;

export type MarkdownContentBlock = {
  kind: 'markdownContent';
  content?: string | { value?: string };
  [key: string]: unknown;
};

export type TextEditGroupBlock = {
  kind: 'textEditGroup';
  uri?: string | { path?: string; fsPath?: string };
  edits?: unknown[];
  [key: string]: unknown;
};

export type ToolInvocationBlock = {
  kind: 'toolInvocation' | 'toolInvocationSerialized';
  toolName?: string;
  toolId?: string;
  invocationMessage?: string | { value?: string };
  pastTenseMessage?: string | { value?: string };
  input?: unknown;
  [key: string]: unknown;
};

export type UnknownBlock = {
  kind: string;
  [key: string]: unknown;
};
