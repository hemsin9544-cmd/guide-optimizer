import { BaseExporter, ExportOptions } from "./base-exporter";

export class PDFExporter extends BaseExporter {
  format = "pdf";
  mimeType = "application/pdf";
  extension = ".pdf";

  async export(content: string, options?: ExportOptions): Promise<Buffer> {
    // TODO: Implement PDF generation without Puppeteer for production
    // For now, return a placeholder buffer
    const message =
      "PDF export requires Puppeteer with Chromium. Use HTML export instead.";
    return Buffer.from(message);
  }
}
