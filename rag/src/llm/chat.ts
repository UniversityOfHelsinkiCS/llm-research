import type { Assistant } from "openai/resources/beta/assistants";
import OpenAIService from "./openai/OpenAIService.ts";
import readline from "readline";

const oapi = new OpenAIService();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function printCommands() {
  console.log("=========================================");
  console.log("");
  console.log("CHAT COMMANDS 💬 ---------------------------");
  console.log("s - start chat");
  console.log("l - list chats");
  console.log("d - delete chat");
  console.log("o - open chat");
  console.log("");

  console.log("OPENAI COMMANDS 👾 ---------------------------");
  console.log("la - list assistants");
  console.log("lai - list assistants with detailed info");
  console.log("");

  console.log("OTHER COMMANDS 🫧 ---------------------------");
  console.log("i - show info");
  console.log("c - list commands");
  console.log("q - quit");
  console.log("");
}

async function command() {
  rl.question("Command: ", (answer) => {
    console.log("");

    switch (answer) {
      // Chat commands -----------------------------------------------------------------------------------

      case "s": // start chat
        break;

      case "l": // list chats
        break;

      case "d": // delete chat
        break;

      case "o": // open chat
        break;

      // OpenAI commands  -----------------------------------------------------------------------------------

      case "la": // list assistants
        (async () => {
          const assistants = await oapi.getAssistants(10);
          console.log("Assistants:");
          assistants.forEach((assistant: Assistant) => {
            console.log(`Assistant ID: ${assistant.id}`);
            console.log(`Name: ${assistant.name}`);
            console.log("");
          });
          command();
        })();
        break;

      case "lai": // list assistants with detailed info
        (async () => {
          const assistants = await oapi.getAssistants(10);
          console.log("Assistants:");
          assistants.forEach((assistant: Assistant) => {
            console.log(`Assistant ID: ${assistant.id}`);
            console.log(`Name: ${assistant.name}`);
            console.log(`Created at: ${assistant.created_at}`);
            console.log(`Description: ${assistant.description}`);
            console.log(`Model: ${assistant.model}`);
            console.log(`Instructions: ${assistant.instructions}`);
            console.log(`Tools: ${JSON.stringify(assistant.tools, null, 2)}`);
            console.log(
              `Tool resources: ${JSON.stringify(
                assistant.tool_resources,
                null,
                2
              )}`
            );
            console.log(
              `Metadata: ${JSON.stringify(assistant.metadata, null, 2)}`
            );
            console.log(`Top P: ${assistant.top_p}`);
            console.log(`Temperature: ${assistant.temperature}`);
            console.log(`Response format: ${assistant.response_format}`);
            console.log("");
          });
          command();
        })();
        break;

      // Other commands -----------------------------------------------------------------------------------

      case "i": // show info
        console.log("No info for you my friend");
        command();
        break;

      case "lc": // list commands
        printCommands();
        command();
        break;

      case "q": // quit
        process.exit(0);

      default: // invalid command
        console.log("Invalid command");
        console.log("");
        command();
    }
  });
}

const startChat = () => {
  printCommands();
  command();
};

export { startChat };
