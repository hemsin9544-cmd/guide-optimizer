import { BaseExporter, ExportOptions } from "./base-exporter";
import { marked } from "marked";
import puppeteer from "puppeteer";

export class PDFExporter extends BaseExporter {
  format = "pdf";
  mimeType = "application/pdf";
  extension = ".pdf";

  async export(content: string, options?: ExportOptions): Promise<Buffer> {
    const body = await marked(content);
    const title = options?.title || "Exported Document";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; line-height: 1.6; color: #1a1a1a; }
    h1, h2, h3 { color: #1a1a1a; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>${body}</body>
</html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
