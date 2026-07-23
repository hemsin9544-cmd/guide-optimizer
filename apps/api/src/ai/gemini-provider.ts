import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  BaseProvider,
  AnalysisType,
  AnalysisResult,
  Message,
} from "./base-provider";

export class GeminiProvider extends BaseProvider {
  name = "Gemini";
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    super();
    this.client = new GoogleGenerativeAI(apiKey);
  }

  private getModel() {
    return this.client.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
  }

  async analyze(content: string, type: AnalysisType): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(content, type);
    const model = this.getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return this.parseAnalysisResponse(text, type);
  }

  async optimize(content: string, instructions: string): Promise<string> {
    const model = this.getModel();
    const result = await model.generateContent(
      `Optimize this content based on these instructions: ${instructions}\n\nContent:\n${content}`,
    );
    return result.response.text();
  }

  async chat(messages: Message[]): Promise<string> {
    const model = this.getModel();
    // Gemini doesn't use a "system" role the same way; fold system messages into the first user turn
    const history = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({ history: history.slice(0, -1) });
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  }
}
