/** One duplex connection; `Out` is what this side sends. Incoming data is untyped until parsed. */
export interface Link<Out> {
  send(message: Out): void;
  close(): void;
  onMessage(handler: (raw: unknown) => void): void;
  /** Fires once, whether the remote or this side closed it. */
  onClose(handler: () => void): void;
}
