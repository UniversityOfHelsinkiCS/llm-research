import { createClient } from 'redis'
import { config } from './config.ts'

const redisClient = createClient({
  url:  `redis://localhost:6379`,
})

await redisClient.connect().then(() => {
  console.log('Redis client connected')
}).catch((err) => {
  console.error('Redis client connection error', err)
})

export const createIndex = async (indexName: string) => {
  try {
    await redisClient.ft.create(
      indexName,
      {
        metadata: {
          type: 'TEXT',
        },
        content: {
          type: 'TEXT',
        },
        embedding: {
          type: 'VECTOR',
          TYPE: 'FLOAT32',
          ALGORITHM: 'HNSW',
          DIM: config.EMBED_DIM,
          DISTANCE_METRIC: 'L2',
        },
      },
      {
        ON: 'HASH',
        PREFIX: 'doc:',
      }
    )

    console.log(`Index ${indexName} created`)
  } catch (err) {
    if (err.message.includes('Index already exists')) {
      console.log(`Index ${indexName} already exists`)
    } else {
      console.error('Error creating index', err)
    }
  }
}

export const addDocument = async (id: string, metadata: { [key: string]: any } | undefined, content: string, embedding: number[]) => {
  const embeddingBuffer = Buffer.copyBytesFrom(new Float32Array(embedding))

  // Check if the embedding length is correct
  if (embeddingBuffer.length !== 4 * config.EMBED_DIM) {
    throw new Error(`Embedding length is incorrect, got ${embeddingBuffer.length} bytes`)
  }

  await redisClient.hSet(`doc:${id}`, {
    metadata: JSON.stringify(metadata || {}),
    content,
    embedding: embeddingBuffer,
  })

  console.log(`Document ${id} added`)
}

export const search = async (indexName: string, embedding: number[], k: number) => {
  const embeddingBuffer = Buffer.copyBytesFrom(new Float32Array(embedding))

  if (embeddingBuffer.length !== 4 * config.EMBED_DIM) {
    throw new Error(`Embedding length is incorrect, got ${embeddingBuffer.length} bytes`)
  }

  const queryString = `(*)=>[KNN ${k} @embedding $vec_param AS score]`

  const results = await redisClient.ft.search(
    indexName,
    queryString,
    {
      PARAMS: {
        vec_param: embeddingBuffer,
      },
      DIALECT: 2,
      RETURN: ['content', 'title', 'score'], // Specify the fields to return
    }
  )

  return results
}
