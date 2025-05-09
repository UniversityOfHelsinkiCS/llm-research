import { config } from "../config.ts"
import OpenAI from "openai"

export const getDocumentEmbedding = async (client: OpenAI, document: string) => {
  return await getEmbeddingVector(client, `search_document: ${document}`)
}

export const getQueryEmbedding = async (client: OpenAI, query: string) => {
  return await getEmbeddingVector(client, `search_query: ${query}`)
}

const getEmbeddingVector = async (client: OpenAI, query: string) => {
  const response = await client.embeddings.create({
    model: config.EMBED_MODEL,
    input: query,
    encoding_format: "float",
  })

  return response.data[0].embedding
}
