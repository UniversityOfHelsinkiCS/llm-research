import dotenv from "dotenv";
import { AzureOpenAI } from "openai";

dotenv.config();

const endpoint = `https://${process.env.AZURE_RESOURCE}.openai.azure.com/`;

const deployment = process.env.GPT_4O;
const apiVersion = "2025-03-01-preview";
const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_API_KEY,
  deployment,
  apiVersion,
  endpoint,
});

export const getResponse = async (messages: any) => {
  const response = await openai.responses.create({
    model: process.env.GPT_4O as string,
    input: "Write a one-sentence bedtime story about a unicorn.",
  });

  console.log(response.output_text);
};

export const startAssistant = async (instructions: string, prompt: string) => {
  const assistant = await openai.beta.assistants.create({
    name: "Current Assistant",
    instructions,
    model: process.env.GPT_4O_MINI as string,
  });
  const thread = await openai.beta.threads.create();
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt,
  });

  const run = openai.beta.threads.runs
    .stream(thread.id, {
      assistant_id: assistant.id,
    })
    .on("textCreated", (text) => process.stdout.write(" 🤖 >> "))
    .on("textDelta", (textDelta, snapshot) =>
      process.stdout.write(textDelta.value || "")
    )
    .on("toolCallCreated", (toolCall) =>
      process.stdout.write(`\ 🤖 >> ${toolCall.type}\n\n`)
    )
    .on("toolCallDelta", (toolCallDelta, snapshot) => {
      if (toolCallDelta.type === "code_interpreter") {
        if (toolCallDelta.code_interpreter?.input) {
          process.stdout.write(toolCallDelta.code_interpreter.input);
        }
        if (toolCallDelta.code_interpreter?.outputs) {
          process.stdout.write("\noutput >\n");
          toolCallDelta.code_interpreter.outputs.forEach((output) => {
            if (output.type === "logs") {
              process.stdout.write(`\n${output.logs}\n`);
            }
          });
        }
      }
    });
};
