import { BaseProvider } from "./base-provider";
import { ClaudeProvider } from "./claude-provider";
import { GPTProvider } from "./gpt-provider";
import { GeminiProvider } from "./gemini-provider";
import { DeepSeekProvider } from "./deepseek-provider";

export type AIProvider = "claude" | "gpt" | "gemini" | "deepseek";

export class AIProviderFactory {
  static create(provider: AIProvider, apiKey: string): BaseProvider {
    switch (provider) {
      case "claude":
        return new ClaudeProvider(apiKey);
      case "gpt":
        return new GPTProvider(apiKey);
      case "gemini":
        return new GeminiProvider(apiKey);
      case "deepseek":
        return new DeepSeekProvider(apiKey);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
