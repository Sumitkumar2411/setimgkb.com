/**
 * compress.worker.ts
 *
 * Web Worker wrapper for the compression engine.
 * Receives: { file: File, targetKB: number, signatureMode: boolean }
 * Posts back: { type: 'result', payload: CompressionResult }
 *          or: { type: 'error', message: string }
 */

import { compressImage } from '../utils/compressionEngine';

self.addEventListener('message', async (event: MessageEvent) => {
  const { file, targetKB, signatureMode, customWidth, customHeight } = event.data as {
    file: File;
    targetKB: number;
    signatureMode: boolean;
    customWidth?: number;
    customHeight?: number;
  };

  try {
    const result = await compressImage({ file, targetKB, signatureMode, customWidth, customHeight });
    // Transfer the ArrayBuffer for zero-copy performance
    const arrayBuffer = await result.blob.arrayBuffer();
    self.postMessage(
      {
        type: 'result',
        payload: {
          arrayBuffer,
          mimeType: result.blob.type,
          byteSize: result.byteSize,
          width: result.width,
          height: result.height,
          latencyMs: result.latencyMs,
        },
      },
      [arrayBuffer]
    );
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
