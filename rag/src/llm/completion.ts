import { randomUUID } from "node:crypto"
import { ollama } from "./ollama.ts"
import type { Message } from "ollama"

const MODEL_NAME = 'gemma3:1b-it-qat'

const pullingModel = ollama
  .pull({
    model: MODEL_NAME,
  })
  .then(() => {
    console.log(`Completion model ${MODEL_NAME} pulled successfully`)
  })
  .catch((error) => {
    console.error('Error pulling completion model:', error)
  })
console.log(`Pulling completion model ${MODEL_NAME}...`)

export const getCompletion = async (messages: Message[]) => {
  // Wait for the model to be pulled before proceeding
  await pullingModel

  const timeId = `${randomUUID()} --- Completion time (${messages.length} messages)`
  console.time(timeId)
  const response = await ollama.chat({
    model: MODEL_NAME,
    messages,
    stream: false,
  })
  console.timeEnd(timeId)

  return response.message
}
