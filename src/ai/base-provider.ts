export enum AnalysisType {
  SEO = "SEO",
  READABILITY = "READABILITY",
  GRAMMAR = "GRAMMAR",
  STYLE = "STYLE",
  STRUCTURE = "STRUCTURE",
}

export interface AnalysisResult {
  type: AnalysisType;
  score: number;
  suggestions: string[];
  summary: string;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export abstract class BaseProvider {
  abstract name: string;

  abstract analyze(content: string, type: AnalysisType): Promise<AnalysisResult>;
  abstract optimize(content: string, instructions: string): Promise<string>;
  abstract chat(messages: Message[]): Promise<string>;

  protected buildAnalysisPrompt(content: string, type: AnalysisType): string {
    const prompts: Record<AnalysisType, string> = {
      [AnalysisType.SEO]: `Analyze this content for SEO. Provide a score (0-100), key suggestions, and a brief summary.`,
      [AnalysisType.READABILITY]: `Analyze this content for readability. Provide a score (0-100), key suggestions, and a brief summary.`,
      [AnalysisType.GRAMMAR]: `Analyze this content for grammar and spelling. Provide a score (0-100), key suggestions, and a brief summary.`,
      [AnalysisType.STYLE]: `Analyze this content for writing style and tone. Provide a score (0-100), key suggestions, and a brief summary.`,
      [AnalysisType.STRUCTURE]: `Analyze this content for structure and organization. Provide a score (0-100), key suggestions, and a brief summary.`,
    };
    return `${prompts[type]}

Content:
${content}`;
  }

  protected parseAnalysisResponse(text: string, type: AnalysisType): AnalysisResult {
    const scoreMatch = text.match(/score[:\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const suggestions = text.match(/[-•]\s*(.+)/g)?.map((s) => s.replace(/^[-•]\s*/, "")) || [];
    return { type, score, suggestions, summary: text.slice(0, 200) };
  }
}
