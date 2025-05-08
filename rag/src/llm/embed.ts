import { randomUUID } from "node:crypto"
import { ollama, ensureModel } from "./ollama.ts"
import { config } from "../config.ts"

export const getDocumentEmbedding = async (document: string) => {
  return await getEmbedding(`search_document: ${document}`)
}

export const getQueryEmbedding = async (query: string) => {
  return await getEmbedding(`search_query: ${query}`)
}

const getEmbedding = async (query: string) => {
  await ensureModel(config.EMBED_MODEL)

  const timeId = `${randomUUID()} --- Embedding time (${query.length} chars)`
  console.time(timeId)
  const response = await ollama.embed({
    model: config.EMBED_MODEL,
    input: query,
  })
  console.timeEnd(timeId)

  return response.embeddings[0]
}
