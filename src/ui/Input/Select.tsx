import { useId, type ComponentProps } from 'react';
import { cn } from '../cn';
import styles from './Input.module.scss';

export interface SelectProps extends Omit<ComponentProps<'select'>, 'id'> {
  label: string;
}

export function Select({ label, className, ...props }: SelectProps) {
  const id = useId();

  return (
    <div className={cn(styles.field, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <select className={styles.input} id={id} {...props} />
    </div>
  );
}
