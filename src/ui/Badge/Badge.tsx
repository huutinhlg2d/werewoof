import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';
import { cn } from '../cn';
import styles from './Badge.module.scss';

export interface BadgeProps extends ComponentProps<'span'> {
  asChild?: boolean;
  tone?: 'neutral' | 'accent' | 'success' | 'danger';
}

export function Badge({ asChild, tone = 'neutral', className, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span';
  return <Comp className={cn(styles.badge, className)} data-tone={tone} {...props} />;
}
