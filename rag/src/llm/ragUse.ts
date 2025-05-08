import { search } from "../redis.ts";
import { startAssistant } from "./assistant.ts";
import { getCompletion } from "./completion.ts";
import { getEmbedding } from "./embed.ts";

export const ragUse = async (
  index: string,
  query: string,
  options = { k: 3 }
) => {
  const embedding = await getEmbedding(query);
  const results = (await search(index, embedding, options.k)) as {
    documents: {
      id: string;
      value: {
        title: string;
        content: string;
        score: number;
      };
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
    // `Opiskelijan kysymys: "${query}"`,
    // `Vastaus:`,
  ].join("\n");

  const instruction2 = "You are pokemin expert";

  await startAssistant(instruction2, query);
};
