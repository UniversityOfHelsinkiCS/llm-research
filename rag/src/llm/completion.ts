import { config } from "../config.ts"
import { ollama, ensureModel } from "./ollama.ts"
import type { Message } from "ollama"

export const getCompletion = async (messages: Message[]) => {
  await ensureModel(config.COMPLETION_MODEL)

  const response = await ollama.chat({
    model: config.COMPLETION_MODEL,
    messages,
    stream: true,
  })

  return response
}
