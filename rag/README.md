Dumb self made mvp rag

## usage

Run services:

```bash
docker compose up -d
```

Use cli:

```bash
# Load all files recursively from data/ohtu into an index named "myIndex"
npm start -- load data/ohtu myIndex
```

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
