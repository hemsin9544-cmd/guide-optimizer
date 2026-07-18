import { chromium, Browser, Page } from "playwright";

export class CrawlerService {
  private browser: Browser | null = null;

  async init() {
    this.browser = await chromium.launch({ headless: true });
  }

  async crawl(url: string): Promise<string> {
    if (!this.browser) {
      await this.init();
    }

    const page: Page = await this.browser!.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle" });

      // Remove cookie banners (common selectors)
      await page.evaluate(() => {
        const selectors = [
          '[class*="cookie"]',
          '[class*="consent"]',
          '[id*="cookie"]',
          '[id*="consent"]',
        ];
        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => el.remove());
        });
      });

      // Expand accordions (common selectors)
      await page.evaluate(() => {
        document
          .querySelectorAll('details, [class*="accordion"]')
          .forEach((el) => {
            (el as HTMLElement).click();
          });
      });

      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await page.waitForTimeout(1000);

      const html = await page.content();
      return html;
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
