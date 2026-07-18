import { BaseExporter, ExportOptions } from "./base-exporter";

export class MarkdownExporter extends BaseExporter {
  format = "markdown";
  mimeType = "text/markdown";
  extension = ".md";

  async export(content: string, options?: ExportOptions): Promise<string> {
    const header = options ? this.buildHeader(options) : "";
    return `${header}${content}`;
  }

  private buildHeader(options: ExportOptions): string {
    const lines: string[] = [];
    if (options.title) lines.push(`# ${options.title}
`);
    if (options.author) lines.push(`**Author:** ${options.author}
`);
    if (options.date) lines.push(`**Date:** ${options.date}
`);
    if (lines.length) lines.push("---
");
    return lines.join("
");
  }
}
