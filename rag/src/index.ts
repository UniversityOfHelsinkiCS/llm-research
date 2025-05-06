import { readdir, readFile, stat } from "node:fs/promises"
import { Command } from 'commander';
import { addDocument, createIndex, search } from './redis.ts';
import { getEmbedding } from "./ollama.ts";

const createChunks = (file: string, content: string) => {
  const lines = content.split('\n')

  const section: string[] = []
  let title = file
  const sections:  { id: string; title: string; content: string; }[] = []

  for (const line of lines) {
    // Check if line starts with '#'
    if (line.startsWith('#')) {
      const content = section.join('\n')
      if (content.length > 0) {
        sections.push({
          id: `${file}-${sections.length}`,
          title,
          content,
        })
      }
      title = line.replace('#', '').trim()
      section.length = 0
    }
    section.push(line)
  }

  // Add the last section
  if (section.length > 0) {
    const content = section.join('\n')
    sections.push({
      id: `${file}-${sections.length}`,
      title: 'Last Section',
      content,
    })
  }

  return sections
}

const loadDocuments = async (loadpath: string) => {
  // Check if the path is a file
  const stats = await stat(loadpath)
  if (!stats.isDirectory()) {
    await loadFile(loadpath)
    console.log(`Loading file: ${loadpath}`)
    return
  }

  // Recursively read all files in the directory
  const files = await readdir(loadpath, { withFileTypes: true })

  for (const file of files) {
    if (file.isDirectory()) {
      await loadDocuments(`${loadpath}/${file.name}`)
    } else if (file.isFile()) {
      const filePath = `${loadpath}/${file.name}`
      console.log(`Loading file: ${filePath}`)
      await loadFile(filePath)
    }
  }
}

const loadFile = async (filePath: string) => {
  const content = await readFile(filePath, 'utf-8');
  const file = filePath.split('/').pop() || 'unknown';
  const sections = createChunks(file, content);
  for (const section of sections) {
    const embedding = await getEmbedding(section.content);
    await addDocument(section.id, section.title, section.content, embedding);
  }
}

const query = async (query: string) => {
  const embedding = await getEmbedding(query);
  const results = await search('myIndex', embedding, 5) as {
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
    results.documents.forEach((doc) => {
      console.log(`Title: ${doc.value.title}`);
      console.log(`Content: ${doc.value.content}`);
      console.log(`Score: ${doc.value.score}`);
      console.log('---');
    })
  }

  console.log('Search results:', results);
}

const program = new Command()
program
  .command('load')
  .description('Load documents into the index')
  .argument('<loadpath>', 'Path to the documents to load')
  .action(async (loadpath: string) => {
    await loadDocuments(loadpath);
    console.log('Documents loaded successfully');
  });

program
  .command('query')
  .argument('<query>', 'Query to search for')
  .action(query);

await createIndex('myIndex');

program.parse();
