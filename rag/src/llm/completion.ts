import OpenAI from "openai"

export const getCompletion = async (
  client: OpenAI, 
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
) => {

  const response = await client.chat.completions.create({
    model,
    messages,
    stream: true,
  })

  return response
}
