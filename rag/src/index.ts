import "dotenv/config";

import { Command } from "commander";
import { createIndex, search } from "./redis.ts";
import { getQueryEmbedding } from "./llm/embed.ts";
import { ingestionPipeline } from "./ingestion/pipeline.ts";
import { getCompletion } from "./llm/completion.ts";
import { ragUse } from "./llm/ragUse.ts";
import { getOllamaOpenAIClient } from "./llm/ollama.ts";
import { startChat } from "./llm/chat.ts";
import { getAzureOpenAIClient } from "./llm/azure.ts";
import { config } from "./config.ts";

const program = new Command();
program
  .command("load")
  .description("Load documents into a new index")
  .argument("<loadpath>", "Path to the documents to load")
  .argument("<index>", "Index name")
  .action(async (loadpath: string, index: string) => {
    await createIndex(index);
    const client = getAzureOpenAIClient(config.EMBED_MODEL);
    await ingestionPipeline(client, loadpath);
    console.log("Documents loaded successfully");
  });

program
  .command("query")
  .argument("<index>", "Index name")
  .argument("<query>", "Query to search for")
  .action(async (index: string, query: string) => {
    const client = getOllamaOpenAIClient();
    const embedding = await getQueryEmbedding(client, query);
    const results = await search(index, embedding, 5) as any as {
      documents: {
        id: string;
        value: {
          title: string;
          content: string;
          score: number;
          metadata: string;
        }
      }[];
    };

    if (Array.isArray(results?.documents)) {
      results.documents
        .sort((a, b) => a.value.score - b.value.score)
        .forEach((doc) => {
          const metadata = JSON.parse(doc.value.metadata);
          console.log(metadata.titleHierarchy.join(" > "));
        });
    }
  });

program
  .command("prompt")
  .description("Prompt the model")
  .argument("<prompt>", "Prompt to send to the model")
  .option("-m, --model <string>", "Model", process.env.GPT_4O_MINI!)
  .action(async (prompt: string, { model }) => {
    const client = getOllamaOpenAIClient();
    const responseMessage = await getCompletion(client, model, [
      {
        role: "user",
        content: prompt,
      },
    ]);

    for await (const msg of responseMessage) {
      process.stdout.write(msg.choices[0].delta.content ?? "");
    }
  });

program
  .command("rag")
  .description("Prompt the model using rag")
  .argument("<index>", "Index name")
  .argument("<query>", "Query to search for")
  .option("-k, --k <number>", "Number of results to return", "3")
  .option("--api, --api <string>", "Api", "azure")
  .option("--model, --model <string>", "Model", process.env.GPT_4O_MINI!)
  .action(ragUse);

program
  .command("chat")
  .description("Start chat with llm model")
  .option("--model, --model <string>", "Model", process.env.GPT_4O_MINI!)
  .action(startChat);

program.parse();
