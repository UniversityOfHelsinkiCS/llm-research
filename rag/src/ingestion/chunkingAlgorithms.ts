import type { FileData } from "./loader.ts"

export type Chunk = {
  id: string
  title: string
  content: string[]
}

export const createTitleChunks = (file: FileData): Chunk[] => {
  const lines = file.content.split('\n')

  const chunkContent: string[] = []
  let title = file.fileName
  const chunks: Chunk[] = []

  for (const line of lines) {
    // Check if line starts with '#'
    if (line.startsWith('#')) {

      chunks.push({
        id: `${file}-${chunks.length}`,
        title,
        content: [...chunkContent],
      })
    
      title = line.replace('#', '').trim()
      chunkContent.length = 0
    }
    chunkContent.push(line)
  }

  // Add the last section
  if (chunkContent.length > 0) {
    chunks.push({
      id: `${file}-${chunks.length}`,
      title: 'Last Section',
      content: [...chunkContent],
    })
  }

  return chunks
}

export const createStaticChunks = (file: FileData): Chunk[] => {
  const lines = file.content.split('\n').filter((line) => line.trim() !== '')

  if (lines.length <= 2) return []

  const chunks: Chunk[] = []

  for (let i = 1; i < lines.length - 1; i++) {
    const chunkContent = [
      lines[i - 1].trim(),
      lines[i    ].trim(),
      lines[i + 1].trim(),
    ]

    chunks.push({
      id: `${file.fileName}-${i}`,
      title: `Chunk ${i}`,
      content: [...chunkContent],
    })
  }

  return chunks
}
