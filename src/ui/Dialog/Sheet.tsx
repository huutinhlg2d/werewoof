import { Dialog, type DialogProps } from './Dialog';

export function Sheet(props: Omit<DialogProps, 'placement'>) {
  return <Dialog {...props} placement="bottom" />;
}
