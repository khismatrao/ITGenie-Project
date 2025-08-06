// src/scripts/embedAllDocs.ts
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ParserFactory } from "../services/document/ParserFactory.js";
import { createClient } from "@supabase/supabase-js";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DATA_DIR = path.join(__dirname, "../../docs");

async function processAllDocuments() {
  const files = fs.readdirSync(DATA_DIR);

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const parser = ParserFactory.getParser(filePath);
      const docs = await parser.parse(filePath);

      const embeddings = new HuggingFaceTransformersEmbeddings({
        model: "Xenova/all-MiniLM-L6-v2",
      });

      const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      await SupabaseVectorStore.fromDocuments(docs, embeddings, {
        client,
        tableName: "documents",
        queryName: "match_hr_docs",
      });

      console.log(` Stored embeddings for ${file}`);
    } catch (err) {
      console.error(` Failed to process ${file}:`, err.message);
    }
  }
}

processAllDocuments();