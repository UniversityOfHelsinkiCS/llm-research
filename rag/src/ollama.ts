import { randomUUID } from 'node:crypto'
import { Ollama } from 'ollama'

const MODEL_NAME = 'nomic-embed-text'

const ollama = new Ollama({ host: 'http://localhost:11434' })

const pullingModel = ollama
  .pull({
    model: MODEL_NAME,
  })
  .then(() => {
    console.log(`Model ${MODEL_NAME} pulled successfully`)
  })
  .catch((error) => {
    console.error('Error pulling model:', error)
  })
console.log('Ollama client initialized, pulling model...')

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
