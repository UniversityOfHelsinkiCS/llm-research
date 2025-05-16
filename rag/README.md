Dumb self made mvp rag

## usage

Run services:

```bash
docker compose up -d
```

Configure: set a suitable completion model in src/config.ts

Use cli (requires node v23):

```bash
npm i
```

```bash
# Load all files recursively from data/ohtu into an index named "myIndex"
npm start -- load data/ohtu myIndex
```

Intermediary chunks will be stored in /pipeline for debugging

```bash
# Query rag from "myIndex"
npm start -- query myIndex what is scrumbut?
```

```bash
# Prompt LLM using rag index "myIndex" 
npm start -- prompt myIndex what is scrumbut?
```

Debug rag contents

```bash
docker exec -it rag-redis-1 redis-cli
```

Or navigate to [localhost:8001](http://localhost:8001)

## What we've learned

- Database: redis works
- Embedder: nomic-embed-text or snowflake-arcti-embed seem ok
- It's all about the RAG document chunking
