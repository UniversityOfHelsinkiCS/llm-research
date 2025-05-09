#!/bin/bash

# Check if a model name is provided as an argument
if [ -z "$1" ]; then
    echo "Usage: $0 <model>"
    exit 1
fi

MODEL=$1

# Run the docker exec command with the provided model
docker exec -it rag-ollama-1 ollama pull "$MODEL"