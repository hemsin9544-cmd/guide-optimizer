// ============================================
// apps/api/src/crawler/crawler-service.ts
// ============================================
import { chromium, Browser, Page } from "playwright";
import * as cheerio from "cheerio";

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  images: { alt: string; src: string }[];
  wordCount: number;
  readTimeMinutes: number;
  rawHtml: string;
  scrapedAt: Date;
}

export interface CrawlOptions {
  waitForSelector?: string;
  scrollToBottom?: boolean;
  timeout?: number;
  userAgent?: string;
}

export class CrawlerService {
  private browser: Browser | null = null;

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async crawl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    await this.init();

    const page = await this.browser!.newPage();

    try {
      // Set user agent if provided
      if (options.userAgent) {
        await page.setExtraHTTPHeaders({
          "User-Agent": options.userAgent,
        });
      }

      // Navigate to URL
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: options.timeout || 30000,
      });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Scroll to bottom if requested
      if (options.scrollToBottom) {
        await this.scrollToBottom(page);
      }

      // Get page content
      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract data
      const title = $("title").text().trim() || "No title";
      const metaDescription = $('meta[name="description"]').attr("content") || "";

      // Extract headings
      const headings: { level: number; text: string }[] = [];
      $("h1, h2, h3, h4, h5, h6").each((_, el) => {
        const level = parseInt(el.tagName[1]);
        const text = $(el).text().trim();
        if (text) headings.push({ level, text });
      });

      // Extract paragraphs
      const paragraphs: string[] = [];
      $("p").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) paragraphs.push(text);
      });

      // Extract links
      const links: { text: string; href: string }[] = [];
      $("a[href]").each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr("href") || "";
        if (text && href) links.push({ text, href });
      });

      // Extract images
      const images: { alt: string; src: string }[] = [];
      $("img[src]").each((_, el) => {
        const alt = $(el).attr("alt") || "";
        const src = $(el).attr("src") || "";
        if (src) images.push({ alt, src });
      });

      // Calculate word count and read time
      const allText = $("body").text().trim();
      const wordCount = allText.split(/\s+/).length;
      const readTimeMinutes = Math.ceil(wordCount / 200);

      return {
        url,
        title,
        metaDescription,
        headings,
        paragraphs,
        links,
        images,
        wordCount,
        readTimeMinutes,
        rawHtml: html,
        scrapedAt: new Date(),
      };
    } finally {
      await page.close();
    }
  }

  private async scrollToBottom(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
