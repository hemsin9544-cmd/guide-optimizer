import { BaseExporter, ExportOptions } from "./base-exporter";
import puppeteer from "puppeteer";
import { HTMLExporter } from "./html-exporter";

export class PDFExporter extends BaseExporter {
  format = "pdf";
  mimeType = "application/pdf";
  extension = ".pdf";

  async export(content: string, options?: ExportOptions): Promise<Buffer> {
    const htmlExporter = new HTMLExporter();
    const html = await htmlExporter.export(content, options);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "40px", right: "40px", bottom: "40px", left: "40px" },
    });

    await browser.close();
    return pdf;
  }
}
