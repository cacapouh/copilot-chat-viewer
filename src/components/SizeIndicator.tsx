import { formatBytes } from '../utils/sizeLevel';

type Props = {
  bytes: number;
};

export function SizeIndicator({ bytes }: Props) {
  return (
    <div className="text-xs text-neutral-500 tabular-nums">URL {formatBytes(bytes)}</div>
  );
}
