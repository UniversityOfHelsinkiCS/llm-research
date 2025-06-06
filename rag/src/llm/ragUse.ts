import { search } from "../redis.ts";
import { startAssistant } from "./assistant.ts";
import { getAzureOpenAIClient } from "./azure.ts";
import { getCompletion } from "./completion.ts";
import { getQueryEmbedding } from "./embed.ts";
import { getOllamaOpenAIClient } from "./ollama.ts";

type RagUseOptions = {
  k: number;
  api: "azure" | "ollama";
  model: string;
};

export const ragUse = async (index: string, query: string, options: RagUseOptions = { k: 3, api: "azure", model: process.env.GPT_4O_MINI! }) => {
  const embedding = await getQueryEmbedding(query);
  const results = await search(index, embedding, options.k) as {
      documents: {
        id: string;
        value: {
          title: string;
          content: string;
          score: number;
        }
      }[];
    };

  const ragResult = results.documents
    .map((doc) => doc.value.content)
    .join("\n\n---\n\n");

  const instruction = [
    `Olet kurssiassistentti tietojenkäsittelytieteen ohjelmistotuotantokurssilla.`,
    `Vastaa opiskelijan kysymyksiin liittyen kurssiin.`,
    `Seuraavat kurssimateriaalin osat sisältävät hyödyllistä tietoa:`,
    ragResult,
    `---`,
  ].join("\n");

  const instruction2 = "You are pokemin expert";

  const client = options.api === 'azure' ? getAzureOpenAIClient() : getOllamaOpenAIClient();

  console.log("OPTS", options)

  if (options.api === 'azure') {
    await startAssistant(instruction2, query, client, options.model)
  } else {
    for await (const msg of await getCompletion([
      {
        role: "system",
        content: instruction,
      },
      {
        role: "user",
        content: query,
      }
    ])) {
      process.stdout.write(msg.message.content);
    }
  }
};
