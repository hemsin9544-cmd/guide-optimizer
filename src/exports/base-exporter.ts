export interface ExportOptions {
  title?: string;
  author?: string;
  date?: string;
}

export abstract class BaseExporter {
  abstract format: string;
  abstract mimeType: string;
  abstract extension: string;

  abstract export(content: string, options?: ExportOptions): Promise<Buffer | string>;
}
