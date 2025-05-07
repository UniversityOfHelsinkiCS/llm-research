export const config = {
    EMBED_MODEL: process.env.EMBED_MODEL ?? 'nomic-embed-text',
    EMBED_DIM: parseInt(process.env.EMBED_DIM ?? '768'),
    COMPLETION_MODEL: process.env.COMPLETION_MODEL ?? 'qwen3:4b',
}

console.info(config)
