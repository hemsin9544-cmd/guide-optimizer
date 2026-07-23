import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { JWTService, createAuthMiddleware, AuthRequest } from "../auth";
import { ExportFactory, ExportFormat } from "./factory";

export function createExportRouter(
  prisma: PrismaClient,
  jwtService: JWTService,
) {
  const router = Router();
  const auth = createAuthMiddleware(jwtService);

  router.get("/export/:jobId", auth, async (req: AuthRequest, res) => {
    try {
      const jobIdParam = req.params.jobId;
      const jobId = Array.isArray(jobIdParam) ? jobIdParam[0] : jobIdParam;
      const userId = req.user!.userId;
      const format = (req.query.format as string) || "markdown";

      if (!["markdown", "html", "docx", "pdf"].includes(format)) {
        return res.status(400).json({
          message: `Invalid format "${format}". Use markdown, html, docx, or pdf.`,
        });
      }

      const job = await prisma.job.findFirst({
        where: { id: jobId, userId },
        include: { analyses: { orderBy: { createdAt: "desc" } } },
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const crawlAnalysis = job.analyses.find((a) =>
        a.content?.includes('"paragraphs"'),
      );
      if (!crawlAnalysis) {
        return res.status(400).json({
          message:
            "No crawl data found for this job. Run /api/crawl first and wait for completion.",
        });
      }

      let crawlResult: any;
      try {
        crawlResult = JSON.parse(crawlAnalysis.content);
      } catch {
        return res
          .status(500)
          .json({ message: "Stored crawl data is not valid JSON" });
      }

      const aiAnalysis = job.analyses.find((a) =>
        a.content?.includes('"suggestions"'),
      );
      let aiResult: any = null;
      if (aiAnalysis) {
        try {
          aiResult = JSON.parse(aiAnalysis.content);
        } catch {
          aiResult = null;
        }
      }

      const sections: string[] = [];

      sections.push(`# ${crawlResult.title || job.title}\n`);
      sections.push(`**Source URL:** ${crawlResult.url}\n`);
      sections.push(
        `**Word Count:** ${crawlResult.wordCount} | **Read Time:** ${crawlResult.readTimeMinutes} min\n`,
      );

      if (aiResult) {
        sections.push(`## AI Analysis (${aiResult.type})\n`);
        sections.push(`**Score:** ${aiResult.score}/100\n`);
        sections.push(`${aiResult.summary}\n`);
        if (aiResult.suggestions?.length) {
          sections.push(`### Suggestions\n`);
          sections.push(
            aiResult.suggestions.map((s: string) => `- ${s}`).join("\n") + "\n",
          );
        }
      }

      sections.push(`## Content\n`);
      if (
        Array.isArray(crawlResult.paragraphs) &&
        crawlResult.paragraphs.length
      ) {
        sections.push(crawlResult.paragraphs.join("\n\n"));
      } else {
        sections.push("*No extracted paragraph content available.*");
      }

      const markdown = sections.join("\n");

      const exporter = ExportFactory.create(format as ExportFormat);
      const output = await exporter.export(markdown, {
        title: crawlResult.title || job.title,
        date: new Date().toISOString().split("T")[0],
      });

      res.setHeader("Content-Type", exporter.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${(crawlResult.title || job.title || "export").replace(/[^a-z0-9]/gi, "_")}${exporter.extension}"`,
      );
      res.status(200).send(output);
    } catch (error: any) {
      console.error("Export error:", error);
      res
        .status(500)
        .json({ message: "Failed to export content", error: error.message });
    }
  });

  return router;
}
