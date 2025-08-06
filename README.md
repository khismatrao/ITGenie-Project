# ITGenie-Project 🧠💻
Help employees resolve common IT issues using internal documentation

**ITGenie** is an internal AI assistant that helps employees resolve common IT issues by retrieving answers from internal documentation using Retrieval-Augmented Generation (RAG).

This project consists of both the **frontend** and **backend**, located in the same root directory.

---

## 🗂 Project Structure

ITGenie-Project/
├── ITgenieBackend/ # Backend logic (Node.js, Express, LangChain, Qdrant, MongoDB)
│ ├── src/
│ │ └── scripts/
│ │ └── embedAllDocs.ts # Script to embed documents into vector store
│ ├── package.json
│ └── tsconfig.json
├── AI-ITGenie-Assistant/ # React frontend
├── README.md # This file
└── .env # Environment variables for backend

---

## ⚙️ Prerequisites

- Node.js (v18+ recommended)
- `npm` or `pnpm`
- TypeScript installed globally (`npm install -g typescript tsx`)
- Running instances of:
  - **MongoDB Atlas or local MongoDB**
  - **Qdrant vector database** (Docker or cloud)
  - Optional: **Azure OpenAI** or other LLM provider

---

## 🛠 Setup Instructions

### 1. Clone the repository

```bash
git clone git@github.com:khismatrao/ITGenie-Project.git
cd ITGenie-Project/ITgenieBackend
2. Install dependencies

npm install
3. Set up environment variables
Create a .env file in ITgenieBackend/  with the following command:

touch .env

PORT=3000

# Azure OpenAI Settings
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_INSTANCE_NAME=your-instance
AZURE_OPENAI_API_DEPLOYMENT_NAME=your-deployment
AZURE_OPENAI_API_VERSION=2023-05-15

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=documents
QDRANT_API_KEY=your-qdrant-api-key-if-needed

# MongoDB
MONGODB_ATLAS_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
📚 Embedding Internal Documents
Before using the assistant, embed your internal .pdf / .docx documents into the vector store:

npx tsx src/scripts/embedAllDocs.ts

This script processes all documents found in the docs/ folder and stores their embeddings in Qdrant.

🚀 Start the Backend Server
npm run dev
This starts the Express server on http://localhost:3000.

Health check endpoint:

curl http://localhost:3000/health
🌐 Frontend 
If your frontend is in AI-ITGenie-Assistant/:

cd ../AI-ITGenie-Assistant
npm install
npm run dev
🧪 Example API Usage
To ask a question:

POST /ask
Content-Type: application/json

{
  "question": "How to reset my domain password?",
  "sessionId": "optional-session-id",
  "isOnline": true,
  "llm": "azure"
}
