import express from "express";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { MongoClient, ObjectId } from "mongodb";
import { BufferMemory } from "langchain/memory";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { LLMFactory } from "./services/llm/LLMFactory";
import "dotenv/config";
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Allow CORS for your frontend
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());

// Environment variables validation
const requiredEnvVars = [
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_API_INSTANCE_NAME', 
  'AZURE_OPENAI_API_DEPLOYMENT_NAME',
  'MONGODB_ATLAS_URI'
];

function validateEnvironmentVariables() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }
  
  console.log('Environment variables validated');
}

// Validate environment variables on startup
validateEnvironmentVariables();

// MongoDB client setup
const mongoClient = new MongoClient(process.env.MONGODB_ATLAS_URI!, {
  driverInfo: { name: "langchainjs" },
});

// Qdrant client setup (reuse connection)
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  ...(process.env.QDRANT_API_KEY && { apiKey: process.env.QDRANT_API_KEY })
});

// Azure OpenAI Embeddings setup (reuse connection)
const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME!,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || "2023-05-15",
});

// Connect to MongoDB on server startup
async function connectMongoDB() {
  try {
    await mongoClient.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Test Qdrant connection on startup
async function testQdrantConnection() {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionName = process.env.QDRANT_COLLECTION_NAME || "documents";
    const hasCollection = collections.collections.some(c => c.name === collectionName);
    
    if (!hasCollection) {
      console.error(`Qdrant collection "${collectionName}" not found`);
      console.log('Available collections:', collections.collections.map(c => c.name));
      process.exit(1);
    }
    
    console.log(`Connected to Qdrant - Collection "${collectionName}" found`);
  } catch (error) {
    console.error("Failed to connect to Qdrant:", error);
    process.exit(1);
  }
}

// Initialize connections
async function initializeConnections() {
  await connectMongoDB();
  await testQdrantConnection();
}

// Function to get or create memory for a session
async function getMemoryForSession(sessionId: string) {
  const collection = mongoClient.db("langchain").collection("memory");

  return new BufferMemory({
    chatHistory: new MongoDBChatMessageHistory({
      collection,
      sessionId,
    }),
    returnMessages: true, // Return messages as objects instead of strings
  });
}

app.post("/ask", async (req, res) => {
  try {
    const { isOnline, llm, question, sessionId } = req.body;

    // Validation
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required and must be a string" });
    }

    if (question.trim().length === 0) {
      return res.status(400).json({ error: "Question cannot be empty" });
    }

    // Generate sessionId if not provided
    const currentSessionId = sessionId || new ObjectId().toString();
    console.log(`Processing question for session: ${currentSessionId}`);

    // Create vector store from existing collection
    const collectionName = process.env.QDRANT_COLLECTION_NAME || "documents";
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      client: qdrantClient,
      collectionName: collectionName,
    });

    // Perform similarity search
    console.log("Searching for relevant documents...");
    // const results = await vectorStore.similaritySearch(question, 4);
    
    // if (results.length === 0) {
    //   console.log("No relevant documents found");
    // } else {
    //   console.log(`Found ${results.length} relevant documents`);
    // }

    // const context = results.map((doc) => doc.pageContent).join("\n");

    const results = await vectorStore.similaritySearchWithScore(question, 5);
    const relevant = results.filter(([_, score]) => score < 0.8); // Lower score = better match
    
    if (results.length === 0) {
      console.log("No relevant documents found");
    } else {
      console.log(`Found ${results.length} relevant documents`);
    }

    const context = relevant.map((doc) => doc.pageContent).join("\n");

    // Get memory for this session
    const memory = await getMemoryForSession(currentSessionId);

    // Get conversation history
    const chatHistory = await memory.chatHistory.getMessages();
    const conversationHistory = chatHistory
      .map((msg) => `${msg.getType()}: ${msg.content}`)
      .join("\n");

    // Build prompt
    const prompt = `You are a helpful IT assistant. Answer the following question based on the context and conversation history below.

Context:
${context || "No relevant documents found."}

Conversation History:
${conversationHistory}

Current Question:
${question}

Answer:`;

    console.log("Generating response with LLM...");
    const llmStrategy = LLMFactory.create(isOnline, llm);
    const answer = await llmStrategy.generate(prompt);

    // Save the current question and answer to memory
    await memory.chatHistory.addUserMessage(question);
    await memory.chatHistory.addAIMessage(answer);

    console.log("Response generated and saved to memory");

    res.json({
      answer,
      sessionId: currentSessionId,
      documentsFound: results.length
    });
  } catch (err: any) {
    console.error("Error in /ask endpoint:", err);
    res.status(500).json({ 
      error: "Something went wrong",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log("Fetching history for session:", sessionId);

    if (!sessionId || sessionId === 'undefined') {
      return res.status(400).json({ error: "Valid sessionId is required" });
    }

    const collection = mongoClient.db("langchain").collection("memory");

    // Try to find session document
    let sessionDoc = await collection.findOne({ sessionId: sessionId });

    if (!sessionDoc) {
      // Try as ObjectId if string didn't work
      try {
        const objectIdSession = new ObjectId(sessionId);
        sessionDoc = await collection.findOne({ sessionId: objectIdSession });
      } catch {
        // If ObjectId parsing fails, continue with null sessionDoc
      }
    }

    if (!sessionDoc) {
      console.log(`No session found for ID: ${sessionId}`);
      return res.json({ 
        messages: [],
        sessionId: sessionId,
        totalMessages: 0
      });
    }

    if (!sessionDoc.messages || !Array.isArray(sessionDoc.messages)) {
      console.log(`No messages found in session: ${sessionId}`);
      return res.json({ 
        messages: [],
        sessionId: sessionId,
        totalMessages: 0
      });
    }

    // Format messages based on your actual structure
    const formattedMessages = sessionDoc.messages.map((msg: any, index: number) => ({
      id: index,
      type: msg.type === "human" ? "user" : "assistant",
      content: msg.data?.content || msg.content || "",
      timestamp: msg.data?.additional_kwargs?.timestamp || new Date().toISOString(),
      metadata: {
        response_metadata: msg.data?.response_metadata,
        tool_calls: msg.data?.tool_calls || [],
        invalid_tool_calls: msg.data?.invalid_tool_calls || []
      }
    }));

    console.log(`Found ${formattedMessages.length} messages for session: ${sessionId}`);

    res.json({
      messages: formattedMessages,
      sessionId: sessionDoc.sessionId,
      totalMessages: formattedMessages.length
    });
  } catch (err: any) {
    console.error("Error retrieving history:", err);
    res.status(500).json({ 
      error: "Failed to retrieve conversation history",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get("/sessions", async (req, res) => {
  try {
    console.log("Fetching all sessions...");
    const collection = mongoClient.db("langchain").collection("memory");

    // Fetch sessionId and messages for each session
    const sessions = await collection
      .find({}, { 
        projection: { 
          sessionId: 1, 
          messages: 1,
          _id: 0
        } 
      })
      .sort({ _id: -1 }) // Sort by newest first
      .toArray();

    const formattedSessions = sessions.map((session) => {
      // Find the first human message
      const firstHumanMessage = session.messages?.find((msg: any) => msg.type === "human");
      let name = firstHumanMessage?.data?.content || firstHumanMessage?.content || "Untitled";

      // Trim the question to max 50 characters for better display
      if (name.length > 50) {
        name = name.slice(0, 47) + "...";
      }

      // Get message count
      const messageCount = session.messages?.length || 0;

      // Get last message timestamp
      const lastMessage = session.messages?.[session.messages.length - 1];
      const lastActivity = lastMessage?.data?.additional_kwargs?.timestamp || 
                          new Date().toISOString();

      return {
        id: session.sessionId,
        name,
        messageCount,
        lastActivity
      };
    });

    console.log(`Found ${formattedSessions.length} sessions`);

    res.json({ 
      sessions: formattedSessions,
      total: formattedSessions.length
    });
  } catch (err: any) {
    console.error("Error retrieving session list:", err);
    res.status(500).json({ 
      error: "Failed to retrieve session list",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test MongoDB connection
    await mongoClient.db("admin").ping();
    
    // Test Qdrant connection
    await qdrantClient.getCollections();
    
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      services: {
        mongodb: "connected",
        qdrant: "connected"
      }
    });
  } catch (err: any) {
    res.status(503).json({ 
      status: "unhealthy", 
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
});

// Graceful shutdown
async function gracefulShutdown() {
  console.log("Shutting down gracefully...");
  
  try {
    await mongoClient.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing MongoDB:", error);
  }

  process.exit(0);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start server
async function startServer() {
  try {
    await initializeConnections();
    
    app.listen(port, () => {
      console.log(`IT Genie assistant server running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();