// ============================================
// apps/api/src/crawler/job-queue.ts
// ============================================
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { CrawlerService, CrawlResult } from "./crawler-service";

const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const crawlQueue = new Queue("crawl-jobs", { connection: redis });

interface CrawlJobData {
  jobId: string;
  url: string;
  userId: string;
  projectId?: string;
  options?: {
    waitForSelector?: string;
    scrollToBottom?: boolean;
    timeout?: number;
  };
}

export function createCrawlWorker(prisma: PrismaClient) {
  const crawler = new CrawlerService();

  const worker = new Worker<CrawlJobData, CrawlResult>(
    "crawl-jobs",
    async (job: Job<CrawlJobData>) => {
      const { jobId, url, userId, options } = job.data;

      // Update job status to RUNNING
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "RUNNING" },
      });

      try {
        // Perform the crawl
        const result = await crawler.crawl(url, options);

        // Store the crawl result as an analysis
        await prisma.analysis.create({
          data: {
            type: "SEO",
            content: JSON.stringify(result),
            score: Math.min(100, Math.round((result.wordCount / 500) * 10)),
            jobId,
          },
        });

        // Update job status to COMPLETED
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: "COMPLETED",
            title: result.title,
          },
        });

        return result;
      } catch (error: any) {
        // Update job status to FAILED
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            title: `Failed: ${error.message}`,
          },
        });
        throw error;
      }
    },
    { connection: redis }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Crawl job ${job.id} completed: ${job.data.url}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Crawl job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export async function addCrawlJob(data: CrawlJobData) {
  return crawlQueue.add(`crawl-${data.url}`, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  });
}

export async function getJobStatus(jobId: string) {
  const jobs = await crawlQueue.getJobs(["waiting", "active", "completed", "failed"]);
  return jobs.find((j) => j.data.jobId === jobId);
}
