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
    const safeCustomWidth = typeof customWidth === 'number' && customWidth > 0 ? Math.min(Math.round(customWidth), 4096) : undefined;
    const safeCustomHeight = typeof customHeight === 'number' && customHeight > 0 ? Math.min(Math.round(customHeight), 4096) : undefined;
    const result = await compressImage({ file, targetKB, signatureMode, customWidth: safeCustomWidth, customHeight: safeCustomHeight });
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
