import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { JWTService } from "../auth";
import { createAuthMiddleware, AuthRequest } from "../auth";
import { addCrawlJob, getJobStatus } from "./job-queue";

export function createCrawlerRouter(
  prisma: PrismaClient,
  jwtService: JWTService,
) {
  const router = Router();
  const auth = createAuthMiddleware(jwtService);

  router.post("/crawl", auth, async (req: AuthRequest, res) => {
    try {
      const { url, projectId, options } = req.body;
      const userId = req.user!.userId;

      let validatedUrl: URL;
      try {
        validatedUrl = new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL provided" });
      }

      const job = await prisma.job.create({
        data: {
          title: `Crawl: ${validatedUrl.hostname}`,
          description: `Crawling ${url}`,
          status: "PENDING",
          userId,
          projectId: projectId || null,
        },
      });

      await addCrawlJob({
        jobId: job.id,
        url: validatedUrl.toString(),
        userId,
        projectId,
        options,
      });

      res.status(202).json({
        message: "Crawl job started",
        jobId: job.id,
        url: validatedUrl.toString(),
        status: "PENDING",
      });
    } catch (error: any) {
      console.error("Crawl error:", error);
      res.status(500).json({ message: "Failed to start crawl job" });
    }
  });

  router.get("/crawl/:jobId/status", auth, async (req: AuthRequest, res) => {
    try {
      const jobIdParam = req.params.jobId;
      const jobId = Array.isArray(jobIdParam) ? jobIdParam[0] : jobIdParam;
      const userId = req.user!.userId;

      const job = await prisma.job.findFirst({
        where: { id: jobId, userId },
        include: {
          analyses: true,
        },
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const queueJob = await getJobStatus(jobId);

      res.json({
        jobId: job.id,
        status: job.status,
        title: job.title,
        description: job.description,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        progress: queueJob?.progress || 0,
        result: job.analyses[0]?.content
          ? JSON.parse(job.analyses[0].content)
          : null,
      });
    } catch (error: any) {
      console.error("Status check error:", error);
      res.status(500).json({ message: "Failed to get job status" });
    }
  });

  router.get("/crawl/history", auth, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.userId;

      const jobs = await prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          analyses: {
            select: { type: true, score: true, createdAt: true },
          },
        },
      });

      res.json(jobs);
    } catch (error: any) {
      console.error("History error:", error);
      res.status(500).json({ message: "Failed to get crawl history" });
    }
  });

  return router;
}
