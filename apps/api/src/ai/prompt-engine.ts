import fs from "fs/promises";
import path from "path";

interface PromptTemplate {
  name: string;
  template: string;
}

export class PromptEngine {
  private promptsDir: string;
  private cache: Map<string, string> = new Map();

  constructor(promptsDir: string = path.join(__dirname, "../../prompts")) {
    this.promptsDir = promptsDir;
  }

  async load(name: string): Promise<string> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    const filePath = path.join(this.promptsDir, `${name}.md`);
    const template = await fs.readFile(filePath, "utf-8");
    this.cache.set(name, template);
    return template;
  }

  async render(name: string, variables: Record<string, string>): Promise<string> {
    const template = await this.load(name);
    return template.replace(/\{\{(.+?)\}\}/g, (_, key) => variables[key.trim()] || "");
  }

  invalidate(name?: string): void {
    if (name) {
      this.cache.delete(name);
    } else {
      this.cache.clear();
    }
  }

  async list(): Promise<string[]> {
    const files = await fs.readdir(this.promptsDir);
    return files.filter((f) => f.endsWith(".md")).map((f) => f.replace(".md", ""));
  }
}
