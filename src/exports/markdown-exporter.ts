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
    if (options.title) lines.push(`# ${options.title}\n`);
    if (options.author) lines.push(`**Author:** ${options.author}\n`);
    if (options.date) lines.push(`**Date:** ${options.date}\n`);
    if (lines.length) lines.push("---\n");
    return lines.join("\n");
  }
}
