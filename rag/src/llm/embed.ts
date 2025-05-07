import { randomUUID } from "node:crypto"
import { ollama, ensureModel } from "./ollama.ts"
import { config } from "../config.ts"

export const getEmbedding = async (prompt: string) => {
  await ensureModel(config.EMBED_MODEL)

  const timeId = `${randomUUID()} --- Embedding time (${prompt.length} chars)`
  console.time(timeId)
  const response = await ollama.embed({
    model: config.EMBED_MODEL,
    input: prompt,
  })
  console.timeEnd(timeId)

  return response.embeddings[0]
}
