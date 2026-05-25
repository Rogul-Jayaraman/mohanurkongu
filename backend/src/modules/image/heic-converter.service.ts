import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export async function heicConvert(inputPath: string): Promise<string> {
  const outputFilename = `${crypto.randomUUID()}.png`;
  const outputPath = path.join(os.tmpdir(), outputFilename);

  const heicConvertModule = await import('heic-convert');

  const inputBuffer = await fs.readFile(inputPath);

  if (typeof heicConvertModule.default === 'function') {
    const outputBuffer = await heicConvertModule.default({
      buffer: inputBuffer,
      format: 'PNG',
    });
    await fs.writeFile(outputPath, outputBuffer);
  } else if (typeof (heicConvertModule as any).convert === 'function') {
    const outputBuffer = await (heicConvertModule as any).convert({
      buffer: inputBuffer,
      format: 'PNG',
    });
    await fs.writeFile(outputPath, outputBuffer);
  } else {
    throw new Error('heic-convert module has no recognized export');
  }

  return outputPath;
}
