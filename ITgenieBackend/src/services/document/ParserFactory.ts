// src/services/document/ParserFactory.ts
import path from "path";
import { DocumentParser } from "./DocumentParser";
import { PDFParser } from "./PDFParser";
import { WordParser } from "./WordParser";
import { TextParser } from "./TextParser";

export class ParserFactory {
  static getParser(filePath: string): DocumentParser {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case ".pdf":
        return new PDFParser();
      case ".docx":
        return new WordParser();
      case ".txt":
        return new TextParser();
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }
}
