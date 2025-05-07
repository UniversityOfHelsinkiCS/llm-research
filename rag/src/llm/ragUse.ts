import { search } from "../redis.ts";
import { getCompletion } from "./completion.ts";
import { getEmbedding } from "./embed.ts";

export const ragUse = async (index: string, query: string, options = { k: 3 }) => {
  const embedding = await getEmbedding(query);
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

  const ragResult = results.documents.map((doc) => doc.value.content).join('\n\n---\n\n');
  
  const systemPrompt = `Olet kurssiassistentti tietojenkäsittelytieteen ohjelmistotuotantokurssilla. Vastaa opiskelijan kyselyihin.\n\nSeuraavat kurssimateriaalin osat voivat olla relevantteja:\n${ragResult}\n\Opiskelijan kysymys: ${query}\nVastaus:`;

  console.log(`\nSystem Prompt:\n${systemPrompt}`);

  const responseMessage = await getCompletion([
    {
      role: 'user',
      content: systemPrompt,
    },
  ]);

  console.log(`Response:\n${responseMessage.content}`);
}
