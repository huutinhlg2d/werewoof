import type { ComponentProps } from 'react';
import { cn } from '../cn';
import styles from './Page.module.scss';

export function Page({ className, ...props }: ComponentProps<'main'>) {
  return <main className={cn(styles.page, className)} {...props} />;
}
