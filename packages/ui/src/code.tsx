import { type JSX } from 'react';

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string | undefined;
}): JSX.Element {
  return <code className={className}>{children}</code>;
}
