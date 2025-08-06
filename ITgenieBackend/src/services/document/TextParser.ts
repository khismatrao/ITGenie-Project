import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { DocumentParser } from "./DocumentParser";

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\f\r]/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1 $2')
    .trim();
}

export class TextParser implements DocumentParser {
  async parse(filePath: string): Promise<Document[]> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const rawText = fs.readFileSync(filePath, "utf-8");
    const cleanedText = cleanText(rawText);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ': ', ' ', ''],
      keepSeparator: false,
    });

    const docs = await textSplitter.createDocuments([cleanedText], [{
      source: filePath,
      filename: path.basename(filePath),
      fileType: 'txt',
      processedAt: new Date().toISOString(),
    }]);

    return docs;
  }
}
