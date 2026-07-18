import { BaseExporter, ExportOptions } from "./base-exporter";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { marked } from "marked";

export class DOCXExporter extends BaseExporter {
  format = "docx";
  mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  extension = ".docx";

  async export(content: string, options?: ExportOptions): Promise<Buffer> {
    const tokens = marked.lexer(content);
    const children: Paragraph[] = [];

    for (const token of tokens) {
      if (token.type === "heading") {
        children.push(
          new Paragraph({
            text: token.text,
            heading: HeadingLevel.HEADING_1,
          })
        );
      } else if (token.type === "paragraph") {
        children.push(new Paragraph({ text: token.text }));
      } else if (token.type === "code") {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: token.text, font: "Courier New" })],
          })
        );
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    return await Packer.toBuffer(doc);
  }
}
