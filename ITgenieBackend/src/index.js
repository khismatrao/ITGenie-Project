import express from "express";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
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

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// MongoDB client setup
const mongoClient = new MongoClient(process.env.MONGODB_ATLAS_URI || "", {
  driverInfo: { name: "langchainjs" },
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

// Initialize MongoDB connection
connectMongoDB();

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

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    // Generate sessionId if not provided
    const currentSessionId = sessionId || new ObjectId().toString();

    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const vectorStore = new SupabaseVectorStore(
      new HuggingFaceTransformersEmbeddings({
        model: "Xenova/all-MiniLM-L6-v2",
      }),
      {
        client,
        tableName: "documents",
        queryName: "match_hr_docs",
      }
    );

    const results = await vectorStore.similaritySearch(question, 4);
    const context = results.map((doc) => doc.pageContent).join("\n");
    console.log(context);

    // Get memory for this session
    const memory = await getMemoryForSession(currentSessionId);
    
    // Get conversation history
    const chatHistory = await memory.chatHistory.getMessages();
    const conversationHistory = chatHistory
      .map((msg) => `${msg.getType()}: ${msg.content}`)
      .join("\n");

    const prompt = `You are a helpful HR assistant. Answer the following question based on the context and conversation history below.

Context:
${context}

Conversation History:
${conversationHistory}

Current Question:
${question}

Answer:`;

    console.log("starting llm..");
    const llmStrategy = LLMFactory.create(isOnline, llm);
    console.log(llmStrategy, "llm strategy");
    const answer = await llmStrategy.generate(prompt);

    // Save the current question and answer to memory
    await memory.chatHistory.addUserMessage(question);
    await memory.chatHistory.addAIMessage(answer);

    res.json({ 
      answer, 
      sessionId: currentSessionId 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log("Requested sessionId:", sessionId, typeof sessionId);

    const collection = mongoClient.db("langchain").collection("memory");
    
    // Try both string and number versions of sessionId
    let sessionDoc = await collection.findOne({ 
      sessionId: sessionId // Try as string first
    });
    
    if (!sessionDoc) {
      // Try as number if string didn't work
      const numericSessionId = parseInt(sessionId);
      if (!isNaN(numericSessionId)) {
        sessionDoc = await collection.findOne({ 
          sessionId: numericSessionId 
        });
        console.log("Trying numeric sessionId:", numericSessionId);
      }
    }
    
    console.log("Found session document:", !!sessionDoc);
    
    if (!sessionDoc || !sessionDoc.messages) {
      return res.json({ messages: [] });
    }
    
    // Format messages based on your actual structure
    const formattedMessages = sessionDoc.messages.map((msg, index) => ({
      id: index,
      type: msg.type === "human" ? "user" : "assistant",
      content: msg.data.content,
      timestamp: msg.data.additional_kwargs?.timestamp || new Date().toISOString(),
      // Include additional metadata if needed
      metadata: {
        response_metadata: msg.data.response_metadata,
        tool_calls: msg.data.tool_calls || [],
        invalid_tool_calls: msg.data.invalid_tool_calls || []
      }
    }));
    
    res.json({ 
      messages: formattedMessages,
      sessionId: sessionDoc.sessionId,
      totalMessages: formattedMessages.length
    });
  } catch (err) {
    console.error("Error retrieving history:", err);
    res.status(500).json({ error: "Failed to retrieve conversation history" });
  }
});

// Endpoint to get conversation history for a session
app.get("/history/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const memory = await getMemoryForSession(sessionId);
    const messages = await memory.chatHistory.getMessages();

    const formattedMessages = messages.map((msg) => ({
      type: msg.getType(),
      content: msg.content,
      timestamp: msg.additional_kwargs?.timestamp || new Date().toISOString(),
    }));

    res.json({ messages: formattedMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve conversation history" });
  }
});
app.get("/sessions", async (req, res) => {
  try {
    const collection = mongoClient.db("langchain").collection("memory");

    // Fetch sessionId and first human message for each session
    const sessions = await collection
      .find({}, { projection: { sessionId: 1, messages: 1 } })
      .toArray();

    const formattedSessions = sessions.map((session) => {
      const firstHumanMessage = session.messages?.find((msg) => msg.type === "human");
      let name = firstHumanMessage?.data?.content || "Untitled";

      // Trim the question to max 30 characters
      if (name.length > 30) {
        name = name.slice(0, 27) + "...";
      }

      return {
        id: session.sessionId,
        name,
      };
    });

    res.json({ sessions: formattedSessions });
  } catch (err) {
    console.error("Error retrieving session list:", err);
    res.status(500).json({ error: "Failed to retrieve session list" });
  }
});


// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await mongoClient.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await mongoClient.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`AI assistant server running on port ${port}`);
});