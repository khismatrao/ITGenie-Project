import { Document } from "langchain/document";

export interface DocumentParser {
  parse(filePath: string): Promise<Document[]>;
}
