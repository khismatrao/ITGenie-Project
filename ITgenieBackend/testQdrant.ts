import { QdrantClient } from "@qdrant/qdrant-js";

const client = new QdrantClient({ url: "http://localhost:6333" });

async function test() {
  const collections = await client.getCollections();
  console.log(collections);
}

test();
