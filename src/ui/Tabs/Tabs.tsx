import * as RadixTabs from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { cn } from '../cn';
import styles from './Tabs.module.scss';

function Root({ className, ...props }: ComponentProps<typeof RadixTabs.Root>) {
  return <RadixTabs.Root className={cn(styles.root, className)} {...props} />;
}

function List({ className, ...props }: ComponentProps<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn(styles.list, className)} {...props} />;
}

function Trigger({ className, ...props }: ComponentProps<typeof RadixTabs.Trigger>) {
  return <RadixTabs.Trigger className={cn(styles.trigger, className)} {...props} />;
}

function Content({ className, ...props }: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn(styles.content, className)} {...props} />;
}

export const Tabs = { Root, List, Trigger, Content };
