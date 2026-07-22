import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { JWTService, createAuthMiddleware, AuthRequest } from "../auth";
import { AIProviderFactory, AIProvider } from "./factory";
import { AnalysisType } from "./base-provider";
import { PromptEngine } from "./prompt-engine";

export function createAnalyzeRouter(
  prisma: PrismaClient,
  jwtService: JWTService,
) {
  const router = Router();
  const auth = createAuthMiddleware(jwtService);
  const promptEngine = new PromptEngine();

  router.post("/analyze/:jobId", auth, async (req: AuthRequest, res) => {
    try {
      const jobIdParam = req.params.jobId;
      const jobId = Array.isArray(jobIdParam) ? jobIdParam[0] : jobIdParam;
      const userId = req.user!.userId;
      const {
        type = "SEO",
        provider = "claude",
      }: { type?: keyof typeof AnalysisType; provider?: AIProvider } =
        req.body || {};

      const job = await prisma.job.findFirst({
        where: { id: jobId, userId },
        include: { analyses: true },
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const crawlAnalysis = job.analyses.find((a: { content: string }) =>
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

      const content: string = Array.isArray(crawlResult.paragraphs)
        ? crawlResult.paragraphs.join("\n\n")
        : crawlResult.rawHtml || "";

      if (!content.trim()) {
        return res
          .status(400)
          .json({ message: "Crawled content is empty, nothing to analyze" });
      }

      const apiKeyEnvMap: Record<AIProvider, string | undefined> = {
        claude: process.env.ANTHROPIC_API_KEY,
        gpt: process.env.OPENAI_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
        deepseek: process.env.DEEPSEEK_API_KEY,
      };
      const apiKey = apiKeyEnvMap[provider];
      if (!apiKey) {
        return res.status(500).json({
          message: `No API key configured for provider "${provider}". Set the relevant env var in Railway.`,
        });
      }

      const aiProvider = AIProviderFactory.create(provider, apiKey);
      const analysisType = AnalysisType[type] ?? AnalysisType.SEO;

      console.log(
        `AI ANALYZE: job=${jobId} provider=${provider} type=${analysisType}`,
      );
      const result = await aiProvider.analyze(content, analysisType);

      const savedAnalysis = await prisma.analysis.create({
        data: {
          type: analysisType,
          content: JSON.stringify(result),
          score: result.score,
          jobId: job.id,
        },
      });

      res.status(200).json({
        message: "Analysis complete",
        analysisId: savedAnalysis.id,
        provider: aiProvider.name,
        result,
      });
    } catch (error: any) {
      console.error("AI analyze error:", error);
      res
        .status(500)
        .json({ message: "Failed to analyze content", error: error.message });
    }
  });

  return router;
}
