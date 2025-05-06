import { Ollama } from 'ollama'

const MODEL_NAME = 'snowflake-arctic-embed2'

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

  const response = await ollama.embed({
    model: MODEL_NAME,
    input: prompt,
  })

  return response.embeddings[0]
}
