import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';
import { cn } from '../cn';
import styles from './Card.module.scss';

export interface CardProps extends ComponentProps<'div'> {
  asChild?: boolean;
  tone?: 'default' | 'raised';
}

export function Card({ asChild, tone = 'default', className, ...props }: CardProps) {
  const Comp = asChild ? Slot : 'div';
  return <Comp className={cn(styles.card, className)} data-tone={tone} {...props} />;
}
