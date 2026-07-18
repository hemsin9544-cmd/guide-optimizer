import { BaseExporter } from "./base-exporter";
import { MarkdownExporter } from "./markdown-exporter";
import { HTMLExporter } from "./html-exporter";
import { DOCXExporter } from "./docx-exporter";
import { PDFExporter } from "./pdf-exporter";

export type ExportFormat = "markdown" | "html" | "docx" | "pdf";

export class ExportFactory {
  static create(format: ExportFormat): BaseExporter {
    switch (format) {
      case "markdown":
        return new MarkdownExporter();
      case "html":
        return new HTMLExporter();
      case "docx":
        return new DOCXExporter();
      case "pdf":
        return new PDFExporter();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
