import Anthropic from "@anthropic-ai/sdk";
import { BaseProvider, AnalysisType, AnalysisResult, Message } from "./base-provider";

export class ClaudeProvider extends BaseProvider {
  name = "Claude";
  private client: Anthropic;

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }

  async analyze(content: string, type: AnalysisType): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(content, type);
    const response = await this.client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return this.parseAnalysisResponse(text, type);
  }

  async optimize(content: string, instructions: string): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      messages: [
        { role: "user", content: `Optimize this content based on these instructions: ${instructions}\n\nContent:\n${content}` },
      ],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      messages: messages.map((m) => ({ role: m.role === "system" ? "assistant" : m.role, content: m.content })),
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }
}
