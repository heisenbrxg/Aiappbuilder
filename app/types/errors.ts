export interface BoltPreviewError {
  source: 'webcontainer' | 'action-runner' | 'preview-iframe' | 'terminal';
  subType: string;
  message: string;
  stack?: string;
  filePath?: string;
  line?: number;
  column?: number;
  importPath?: string;
  terminalOutput?: string;
  previewUrl?: string;
  raw: string;
}

export function createBoltPreviewError({
  source,
  subType,
  message,
  raw,
  stack,
  filePath,
  line,
  column,
  importPath,
  terminalOutput,
  previewUrl,
}: {
  source: BoltPreviewError['source'];
  subType: string;
  message: string;
  raw: string;
  stack?: string;
  filePath?: string;
  line?: number;
  column?: number;
  importPath?: string;
  terminalOutput?: string;
  previewUrl?: string;
}): BoltPreviewError {
  return {
    source,
    subType,
    message,
    stack,
    filePath,
    line,
    column,
    importPath,
    terminalOutput,
    previewUrl,
    raw,
  };
}
