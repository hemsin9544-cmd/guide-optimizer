import { BaseExporter, ExportOptions } from "./base-exporter";
import { marked } from "marked";

export class HTMLExporter extends BaseExporter {
  format = "html";
  mimeType = "text/html";
  extension = ".html";

  async export(content: string, options?: ExportOptions): Promise<string> {
    const body = await marked(content);
    const title = options?.title || "Exported Document";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1, h2, h3 { color: #1a1a1a; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
  }
}
