import { formatBytes } from '../utils/sizeLevel';

type Props = {
  bytes: number;
};

export function SizeIndicator({ bytes }: Props) {
  return (
    <span className="text-[11px] text-fg-dim tabular-nums normal-case tracking-normal">
      URL {formatBytes(bytes)}
    </span>
  );
}
