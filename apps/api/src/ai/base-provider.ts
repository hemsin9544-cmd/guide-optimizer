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

  abstract analyze(
    content: string,
    type: AnalysisType,
  ): Promise<AnalysisResult>;
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

  protected parseAnalysisResponse(
    text: string,
    type: AnalysisType,
  ): AnalysisResult {
    // Extract score: matches "Score: 85", "SEO Score: 85 / 100", "score of 85", etc.
    const scoreMatch = text.match(
      /score[:\s]*(?:of\s*)?(\d{1,3})(?:\s*\/\s*100)?/i,
    );
    let score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    score = Math.min(100, Math.max(0, score));

    // Extract suggestions: lines starting with -, *, • or numbered (1. 2. etc), ignoring
    // markdown bold markers and empty/separator lines.
    const lines = text.split("\n");
    const suggestions = lines
      .map((line) => line.trim())
      .filter((line) => /^([-*•]|\d+\.)\s+\S/.test(line))
      .map((line) =>
        line
          .replace(/^([-*•]|\d+\.)\s+/, "")
          .replace(/\*\*/g, "")
          .trim(),
      )
      .filter((line) => line.length > 3 && line !== "--");

    // Extract summary: prefer a "Summary:" section if present, else use first
    // substantial paragraph that isn't the score line or a suggestion.
    const summaryMatch = text.match(/summary[:\s]*\n?(.+?)(?:\n\n|\n#|$)/is);
    let summary = summaryMatch
      ? summaryMatch[1].replace(/\*\*/g, "").trim()
      : lines
          .find((l) => l.trim().length > 40 && !/^#|score/i.test(l.trim()))
          ?.trim() || text.slice(0, 200).trim();

    if (summary.length > 400) {
      summary = summary.slice(0, 400).trim() + "...";
    }

    return { type, score, suggestions, summary };
  }
}
