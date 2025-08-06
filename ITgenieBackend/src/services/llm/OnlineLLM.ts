import { AzureChatOpenAI } from "@langchain/openai";
import { ChatMistralAI } from "@langchain/mistralai";
import { LLMStrategy } from "./LLMStrategy";

export class OnlineLLM implements LLMStrategy {
  private model: any;

  constructor(llmName: string = "azure") {
    const llmNameLower = llmName.toLowerCase();

    if (llmNameLower === "azure" || llmNameLower.startsWith("gpt")) {
      this.model = new AzureChatOpenAI({
        temperature: 0.2,
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
        azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
        azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_MODEL!,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-02-15-preview",
      });
    } else if (llmNameLower.startsWith("mistral")) {
      this.model = new ChatMistralAI({
        modelName: llmName,
        temperature: 0.2,
        apiKey: process.env.MISTRAL_API_KEY,
      });
    } else {
      throw new Error(`Unsupported online LLM model: ${llmName}`);
    }
  }

  async generate(prompt: string): Promise<string> {
    const response = await this.model.call([["user", prompt]]);
    return response.content ?? response;
  }

   getLLM() {
    return this.model;
  }
}
