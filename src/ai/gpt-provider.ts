import OpenAI from "openai";
import { BaseProvider, AnalysisType, AnalysisResult, Message } from "./base-provider";

export class GPTProvider extends BaseProvider {
  name = "GPT";
  private client: OpenAI;

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({ apiKey });
  }

  async analyze(content: string, type: AnalysisType): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(content, type);
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0].message.content || "";
    return this.parseAnalysisResponse(text, type);
  }

  async optimize(content: string, instructions: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: `Optimize this content based on these instructions: ${instructions}\n\nContent:\n${content}` },
      ],
    });
    return response.choices[0].message.content || "";
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
    });
    return response.choices[0].message.content || "";
  }
}
