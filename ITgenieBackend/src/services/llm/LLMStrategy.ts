export interface LLMStrategy {
  generate(prompt: string): Promise<string>;
}
