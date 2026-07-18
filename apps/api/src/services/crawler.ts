import { chromium, Browser, Page } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

export class CrawlerService {
  private browser: Browser | null = null;
  private turndown: TurndownService;

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
    });
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
  }

  async crawl(
    url: string,
  ): Promise<{ title: string; markdown: string; url: string }> {
    if (!this.browser) {
      await this.init();
    }

    const page: Page = await this.browser!.newPage();

    try {
      // 1. Launch & Open URL
      await page.goto(url, { waitUntil: "networkidle" });

      // 2. Remove cookie banners
      await page.evaluate(() => {
        const selectors = [
          '[class*="cookie"]',
          '[class*="consent"]',
          '[id*="cookie"]',
          '[id*="consent"]',
          '[class*="gdpr"]',
          '[id*="gdpr"]',
        ];
        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => el.remove());
        });
      });

      // 3. Expand accordions
      await page.evaluate(() => {
        document
          .querySelectorAll(
            'details, [class*="accordion"], [class*="collapse"]',
          )
          .forEach((el) => {
            (el as HTMLElement).click();
          });
      });

      // 4. Scroll page
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);

      // 5. Get HTML
      const html = await page.content();

      // 6. Readability extraction
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) {
        throw new Error("Failed to parse article content");
      }

      // 7. Cheerio cleanup
      const $ = cheerio.load(article.content);
      $(
        "script, style, iframe, embed, object, nav, header, footer, aside",
      ).remove();
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        if (href?.startsWith("#")) {
          $(el).remove();
        }
      });

      // 8. Convert to Markdown
      const cleanHtml = $.html();
      const markdown = this.turndown.turndown(cleanHtml);

      return {
        title: article.title,
        markdown,
        url,
      };
    } finally {
      await page.close();
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
