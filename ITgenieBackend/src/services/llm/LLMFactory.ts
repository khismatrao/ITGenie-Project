// llm/LLMFactory.ts
import { OnlineLLM } from "./OnlineLLM";
import { OfflineLLM } from "./OfflineLLM";
import { LLMStrategy } from "./LLMStrategy";

export class LLMFactory {
  static create(isOnline: boolean, llmName?: string): LLMStrategy {
    return isOnline
      ? new OnlineLLM(llmName)
      : new OfflineLLM(llmName);
  }
}
