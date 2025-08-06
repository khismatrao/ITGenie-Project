// src/scripts/embedAllDocs.ts
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ParserFactory } from "../services/document/ParserFactory.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Azure OpenAI Configuration
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const AZURE_OPENAI_API_INSTANCE_NAME = process.env.AZURE_OPENAI_API_INSTANCE_NAME!;
const AZURE_OPENAI_API_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME!;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2023-05-15";

// Qdrant Configuration
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY; // Optional for cloud instances
const COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || "hr_documents";

const DATA_DIR = path.join(__dirname, "../../docs");

async function initializeQdrant(client: QdrantClient) {
  try {
    // Check if collection exists
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      // Create collection with appropriate vector size for Azure OpenAI embeddings
      // text-embedding-ada-002 produces 1536-dimensional vectors
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536,
          distance: "Cosine",
        },
      });
      console.log(`Created Qdrant collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`Qdrant collection ${COLLECTION_NAME} already exists`);
    }
  } catch (error) {
    console.error("Failed to initialize Qdrant:", error);
    throw error;
  }
}

async function processAllDocuments() {
  try {
    // Initialize Azure OpenAI Embeddings
    const embeddings = new AzureOpenAIEmbeddings({
      azureOpenAIApiKey: AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: AZURE_OPENAI_API_INSTANCE_NAME,
      azureOpenAIApiDeploymentName: AZURE_OPENAI_API_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: AZURE_OPENAI_API_VERSION,
    });

    // Initialize Qdrant client
    const qdrantConfig: any = {
      url: QDRANT_URL,
    };

    if (QDRANT_API_KEY) {
      qdrantConfig.apiKey = QDRANT_API_KEY;
    }

    const qdrantClient = new QdrantClient(qdrantConfig);

    // Initialize collection
    await initializeQdrant(qdrantClient);

    // Process files
    const files = fs.readdirSync(DATA_DIR);
    
    if (files.length === 0) {
      console.log("No files found in data directory");
      return;
    }

    console.log(`Found ${files.length} files to process`);

    for (const file of files) {
      const filePath = path.join(DATA_DIR, file);
      
      // Skip directories
      if (!fs.statSync(filePath).isFile()) {
        console.log(`Skipping directory: ${file}`);
        continue;
      }

      try {
        console.log(`Processing ${file}...`);
        
        const parser = ParserFactory.getParser(filePath);
        const docs = await parser.parse(filePath);

        if (docs.length === 0) {
          console.log(`No documents extracted from ${file}`);
          continue;
        }

        // Add metadata to documents
        const docsWithMetadata = docs.map((doc, index) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            source: file,
            filename: file,
            processed_at: new Date().toISOString(),
            chunk_index: index,
          },
        }));

        // Create vector store and add documents
        await QdrantVectorStore.fromDocuments(
          docsWithMetadata,
          embeddings,
          {
            client: qdrantClient,
            collectionName: COLLECTION_NAME,
          }
        );

        console.log(`Stored ${docs.length} chunks for ${file}`);
      } catch (err: any) {
        console.error(`Failed to process ${file}:`, err.message);
        // Continue processing other files even if one fails
        continue;
      }
    }

    console.log("All documents processed successfully!");
  } catch (error: any) {
    console.error("Failed to process documents:", error.message);
    process.exit(1);
  }
}

// Run the script
processAllDocuments().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});