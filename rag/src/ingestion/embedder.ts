import { Transform } from "node:stream";
import type { Chunk } from "./chunkingAlgorithms.ts";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { getDocumentEmbedding } from "../llm/embed.ts";
import OpenAI from "openai";

export type EmbeddedChunk = Chunk & {
   embedding: number[]
}

export class Embedder extends Transform {
  private cachePath: string;
  private client: OpenAI;

  constructor(client: OpenAI, cachePath: string) {
    super({ objectMode: true });

    this.client = client
    this.cachePath = cachePath + "/embeddings";

    // Make sure the cache path exists
    mkdirSync(this.cachePath, { recursive: true });
  }

  _transform(chunk: Chunk, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    getDocumentEmbedding(this.client, chunk.content.join('\n')).then((embedding) => {
      const embeddedChunk: EmbeddedChunk = {
        ...chunk,
        embedding,
      };

      this.push(embeddedChunk);

      // Save embedded chunk to cache
      const path = `${this.cachePath}/${chunk.id}.json`;

      writeFile(path, JSON.stringify(embeddedChunk, null, 2), 'utf-8').then(() => {
        callback();
      }).catch((error) => {
        console.error(`Error saving chunk to cache: ${error}`);
        callback(error);
      });
    })
  }
}