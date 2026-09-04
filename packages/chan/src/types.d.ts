declare module 'editor' {
  export default function editor(
    file: string,
    callback: (code: number) => void,
    options?: { terminal?: boolean }
  ): void;
}

declare module 'fast-write-atomic' {
  type WriteCallback = (err: NodeJS.ErrnoException | null) => void
  const writeAtomic: {
    (path: string, content: string | Buffer, cb: WriteCallback): void
    promise(path: string, content: string | Buffer): Promise<void>
  }
  export default writeAtomic
}
