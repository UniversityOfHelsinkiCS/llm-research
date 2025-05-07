import { Ollama } from 'ollama'

export const ollama = new Ollama({ host: 'http://localhost:11434' })

const isModelPulled: Record<string, boolean> = {}

export const ensureModel = async (modelName: string) => {
  if (isModelPulled[modelName]) {
    return
  }

  const { models } = await ollama.list()
  const modelExists = models.some((model) => model.name === modelName)
  if (modelExists) {
    isModelPulled[modelName] = true
    return
  }

  console.log(`Pulling model ${modelName}...`)
  try {
    await ollama.pull({ model: modelName })
    console.log(`Model ${modelName} pulled successfully`)
    isModelPulled[modelName] = true
  } catch (error) {
    console.error('Error pulling model:', error)
  }
}