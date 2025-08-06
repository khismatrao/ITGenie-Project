// llm/OfflineLLM.ts
import { Ollama } from "@langchain/ollama";
import { LLMStrategy } from "./LLMStrategy";

export class OfflineLLM implements LLMStrategy {
  private model: Ollama;

  constructor(llm: string = "llama3") {
    this.model = new Ollama({
      baseUrl: "http://localhost:11434",
      model: llm,
    });
  }

  async generate(prompt: string): Promise<string> {
    return this.model.call(prompt);
  }
}
