import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import styles from './Dialog.module.scss';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the dialog; rendered as-is via Slot, so pass a `Button`. */
  trigger?: ReactNode;
  title: string;
  description?: string;
  /** `bottom` renders a phone-style sheet. */
  placement?: 'center' | 'bottom';
  children?: ReactNode;
}

export function Dialog({ open, onOpenChange, trigger, title, description, placement = 'center', children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content
          className={styles.content}
          data-placement={placement}
          // Radix warns without a description; an explicit undefined opts out but would also unlink a real one.
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <header className={styles.header}>
            <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="sm" aria-label="Close">
                ✕
              </Button>
            </RadixDialog.Close>
          </header>
          {description && <RadixDialog.Description className={styles.description}>{description}</RadixDialog.Description>}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
