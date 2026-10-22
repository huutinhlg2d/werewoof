import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps, CSSProperties } from 'react';
import { cn } from '../cn';
import styles from './Stack.module.scss';

type Space = 1 | 2 | 3 | 4 | 6 | 8;

export interface StackProps extends ComponentProps<'div'> {
  asChild?: boolean;
  direction?: 'column' | 'row';
  gap?: Space;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
}

export function Stack({
  asChild,
  direction = 'column',
  gap = 3,
  align,
  justify,
  wrap,
  className,
  style,
  ...props
}: StackProps) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      className={cn(styles.stack, className)}
      style={{
        flexDirection: direction,
        gap: `var(--space-${gap})`,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
      {...props}
    />
  );
}
