import { randomUUID } from "node:crypto"
import { ollama } from "./ollama.ts"

const MODEL_NAME = 'nomic-embed-text'

const pullingModel = ollama
  .pull({
    model: MODEL_NAME,
  })
  .then(() => {
    console.log(`Embedding model ${MODEL_NAME} pulled successfully`)
  })
  .catch((error) => {
    console.error('Error pulling embedding model:', error)
  })
console.log(`Pulling embedding model ${MODEL_NAME}...`)

export const getEmbedding = async (prompt: string) => {
  // Wait for the model to be pulled before proceeding
  await pullingModel

  const timeId = `${randomUUID()} --- Embedding time (${prompt.length} chars)`
  console.time(timeId)
  const response = await ollama.embed({
    model: MODEL_NAME,
    input: prompt,
  })
  console.timeEnd(timeId)

  return response.embeddings[0]
}
