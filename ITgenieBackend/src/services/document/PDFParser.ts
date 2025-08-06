import fs from "fs";
import path from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { DocumentParser } from "./DocumentParser";

function cleanPDFText(text: string): string {
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

export class PDFParser implements DocumentParser {
  async parse(filePath: string): Promise<Document[]> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const loader = new PDFLoader(filePath, {
      splitPages: false,
      parsedItemSeparator: " "
    });

    const rawDocs = await loader.load();
    const fullText = rawDocs
      .map(doc => cleanPDFText(doc.pageContent))
      .join('\n\n');

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ': ', ' ', ''],
      keepSeparator: false
    });

    const docs = await textSplitter.createDocuments([fullText], [{
      source: filePath,
      filename: path.basename(filePath),
      fileType: 'pdf',
      totalPages: rawDocs.length,
      processedAt: new Date().toISOString(),
    }]);

    return docs;
  }
}
