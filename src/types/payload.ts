import type { ChatJson } from './chat';

export type Payload = {
  v: 1;
  rawJson: ChatJson;
  title: string;
};
