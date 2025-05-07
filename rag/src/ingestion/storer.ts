import { Writable } from "node:stream";
import type { EmbeddedChunk } from "./embedder.ts";
import { addDocument } from "../redis.ts";

export class RedisStorer extends Writable {
  constructor() {
    super({ objectMode: true });
  }

  _write(chunk: EmbeddedChunk, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    addDocument(chunk.id, chunk.title, chunk.content.join('\n'), chunk.embedding).then(() => {
      callback();
    })
  }
}
