import { Command } from 'commander';
import { createIndex, search } from './redis.ts';
import { getEmbedding } from "./ollama.ts";
import { ingestionPipeline } from './ingestion/pipeline.ts';

const query = async (index: string, query: string) => {
  const embedding = await getEmbedding(query);
  const results = await search(index, embedding, 5) as {
    documents: {
      id: string;
      value: {
        title: string;
        content: string;
        score: number;
      }
    }[];
  };

  if (Array.isArray(results?.documents)) {
    results.documents.sort((a, b) => a.value.score - b.value.score).forEach((doc) => {
      // console.log(`Title: ${doc.value.title}`);
      console.log(`Content: ${doc.value.content}`);
      console.log(`Score: ${doc.value.score}`);
      console.log('---');
    })
  }
}

const program = new Command()
program
  .command('load')
  .description('Load documents into a new index')
  .argument('<loadpath>', 'Path to the documents to load')
  .argument('<index>', 'Index name')
  .action(async (loadpath: string, index: string) => {
    await createIndex(index);
    await ingestionPipeline(loadpath);
    console.log('Documents loaded successfully');
  });

program
  .command('query')
  .argument('<index>', 'Index name')
  .argument('<query>', 'Query to search for')
  .action(query);

program.parse();
