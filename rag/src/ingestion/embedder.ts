import { Transform } from "node:stream";
import type { Chunk } from "./chunkingAlgorithms.ts";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { getEmbedding } from "../llm/embed.ts";

export type EmbeddedChunk = Chunk & {
   embedding: number[]
}

export class Embedder extends Transform {
  private cachePath: string;

  constructor(cachePath: string) {
    super({ objectMode: true });

    this.cachePath = cachePath + "/embeddings";

    // Make sure the cache path exists
    mkdirSync(this.cachePath, { recursive: true });
  }

  _transform(chunk: Chunk, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    getEmbedding(chunk.content.join('\n')).then((embedding) => {
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