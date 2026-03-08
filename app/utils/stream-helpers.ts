/**
 * Helper utilities for managing ReadableStream operations
 */

/**
 * Creates a safe stream reader that handles locked stream errors gracefully
 */
export async function createSafeStreamReader(
  stream: ReadableStream,
  onLockError?: () => void
): Promise<ReadableStreamDefaultReader | null> {
  try {
    // Check if stream is already locked before trying to get reader
    if ((stream as any).locked) {
      console.warn('Stream is already locked, cannot create reader');
      onLockError?.();
      return null;
    }
    return stream.getReader();
  } catch (error: any) {
    if (error?.message?.includes('locked')) {
      console.warn('Stream lock error:', error);
      onLockError?.();
      return null;
    }
    throw error;
  }
}

/**
 * Pipes one stream to another with proper error handling
 */
export async function pipeStream(
  source: ReadableStream,
  writer: WritableStreamDefaultWriter,
  options?: {
    onError?: (error: Error) => void;
    onComplete?: () => void;
  }
): Promise<void> {
  const reader = await createSafeStreamReader(source);
  
  if (!reader) {
    options?.onError?.(new Error('Failed to get stream reader'));
    return;
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        options?.onComplete?.();
        break;
      }
      
      await writer.write(value);
    }
  } catch (error) {
    console.error('Error during stream piping:', error);
    options?.onError?.(error as Error);
    throw error;
  } finally {
    try {
      reader.releaseLock();
    } catch (e) {
      console.warn('Failed to release reader lock:', e);
    }
  }
}

/**
 * Creates a cloned stream that can be read independently
 */
export function cloneStream(stream: ReadableStream): [ReadableStream, ReadableStream] {
  try {
    // Use the built-in tee() method to split the stream
    return stream.tee();
  } catch (error) {
    console.error('Failed to clone stream:', error);
    // If tee fails, create a passthrough
    const { readable, writable } = new TransformStream();
    
    // Attempt to pipe the original stream
    (async () => {
      try {
        await stream.pipeTo(writable);
      } catch (e) {
        console.error('Pipe error in clone:', e);
      }
    })();
    
    return [readable, stream];
  }
}
