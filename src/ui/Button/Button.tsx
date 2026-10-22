import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';
import { cn } from '../cn';
import styles from './Button.module.scss';

export interface ButtonProps extends ComponentProps<'button'> {
  /** Render the child element (e.g. a router link) with button styling instead of a `<button>`. */
  asChild?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  asChild,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(styles.button, className)}
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth || undefined}
      type={asChild ? undefined : type}
      {...props}
    />
  );
}
