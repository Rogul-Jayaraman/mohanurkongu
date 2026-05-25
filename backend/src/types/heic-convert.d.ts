declare module 'heic-convert' {
  interface HeicConvertOptions {
    buffer: Buffer;
    format: 'PNG' | 'JPEG';
    quality?: number;
  }

  export default function heicConvert(options: HeicConvertOptions): Promise<Buffer>;
  export function convert(options: HeicConvertOptions): Promise<Buffer>;
}
