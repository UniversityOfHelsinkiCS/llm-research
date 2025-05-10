import type {
  Assistant,
  AssistantTool,
} from "openai/resources/beta/assistants";
import OpenAIService, { type AssistantData } from "./openai/OpenAIService.ts";
import { formatAssistantDetails } from "./openai/util/formatAssistantDetails.ts";
import { getPokemonTool } from "./openai/assistant_tools.ts";
import readline from "readline";
import dotenv from "dotenv";
dotenv.config();

const oapi = new OpenAIService();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function printCommands() {
  console.log("=========================================");
  console.log("");
  console.log("CHAT COMMANDS 💬 -----------------------------");
  console.log("s - start chat");
  console.log("l - list chats");
  console.log("o - open chat");
  console.log("d - delete chat");
  console.log("");

  console.log("OPENAI COMMANDS 👾 ---------------------------");
  console.log("la - list assistants");
  console.log("lai - list assistants with detailed info");
  console.log("ga - get assistant details by assistant ID");
  // console.log("ca - create assistant");
  // console.log("da - delete assistant");
  console.log("");

  console.log("OTHER COMMANDS 🫧 -----------------------------");
  console.log("help - list commands");
  console.log("q - quit");
  console.log("");
}

// TODO: create a cli to choose the assistant from a list
const tempDefaultAssistant = "asst_FmeryOpYmAbgfUsRP7La9i86";

async function command() {
  rl.question("Command: ", (answer) => {
    console.log("");

    switch (answer) {
      // Chat commands -----------------------------------------------------------------------------------

      case "s": // start chat
        (async () => {
          const { assistantId, threadId } = await oapi.createChat(
            tempDefaultAssistant
          );
        })();
        break;

      case "l": // list chats
        break;

      case "o": // open chat
        break;

      case "d": // delete chat
        break;

      // OpenAI commands  -----------------------------------------------------------------------------------

      case "la": // list assistants
        (async () => {
          const assistants = await oapi.getAssistants(20);
          console.log("Assistants:");
          assistants.forEach((assistant: Assistant) => {
            console.log(`Assistant ID: ${assistant.id}`);
            console.log(`Name: ${assistant.name}`);
            console.log(
              `Created At: ${new Date(
                assistant.created_at * 1000
              ).toLocaleString()}`
            );
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
            console.log(formatAssistantDetails(assistant));
            console.log("");
          });
          command();
        })();
        break;

      case "ga": // get assistant details by assistant ID
        rl.question("Assistant ID: ", async (assistantId) => {
          const assistant = await oapi.getAssistant(assistantId);
          if (assistant) {
            console.log(formatAssistantDetails(assistant));
            console.log("");
          } else {
            console.log("Assistant not found");
            console.log("");
          }
          command();
        });
        break;

      // case "ca": // create assistant
      //   async () => {
      //     const data: AssistantData = {
      //       name: "Pokemon Master",
      //       instructions: "Answer questions about Pokemon",
      //       model: process.env.GPT_4O_MINI,
      //       tools: [getPokemonTool.description as AssistantTool],
      //     };

      //     const assistant = await oapi.createAssistant(data);
      //     if (assistant) {
      //       console.log("Assistant created:");
      //       console.log(formatAssistantDetails(assistant));
      //       console.log("");
      //     } else {
      //       console.log("Failed to create assistant");
      //       console.log("");
      //     }
      //     command();
      //   };
      //   break;

      // Other commands -----------------------------------------------------------------------------------

      case "help": // list commands
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
