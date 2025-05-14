import type { Assistant } from "openai/resources/beta/assistants";
import OpenAIService, { type AssistantData } from "./openai/OpenAIService.ts";
import {
  formatAssistantDetails,
  formatAssistantSimple,
} from "./openai/util/formatAssistantDetails.ts";
import readline from "readline";
import chalk from "chalk";
import assistants from "./openai/data/assistants.json" with { type: "json" };

const oapi = new OpenAIService();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function printCommands() {
  console.log("=========================================");
  console.log("");
  console.log(chalk.bold("CHAT COMMANDS 💬 -----------------------------"));
  console.log("s - start new chat");
  console.log("l - list all chats");
  console.log("o - open old chat");
  console.log("d - delete a chat");
  console.log("");

  console.log(chalk.bold("OPENAI COMMANDS 👾 ---------------------------"));
  console.log("la - list assistants");
  console.log("lai - list assistants with detailed info");
  console.log("ga - get assistant details by assistant ID");
  console.log("ca - create assistant");
  // console.log("da - delete assistant");
  console.log("");

  console.log(chalk.bold("OTHER COMMANDS 🫧 -----------------------------"));
  console.log("help - list commands");
  console.log("q - quit");
  console.log("");
}

// TODO: create a cli to choose the assistant from a list
const defaultAssistant = "asst_FmeryOpYmAbgfUsRP7La9i86"; // pokemon master

async function command() {
  rl.question(chalk.greenBright.bold("Command: "), (answer) => {
    console.log("");

    switch (answer) {
      // Chat commands -----------------------------------------------------------------------------------

      case "s": // start new chat
        (async () => {
          const { assistantId, threadId } = await oapi.createChat(
            defaultAssistant
          );

          startChatRun(assistantId, threadId);
        })();
        break;

      case "l": // list all chats
        console.log("List of chats not implemented yet");
        console.log("");
        command();
        break;

      case "o": // open old chat
        console.log("Open old chat not implemented yet");
        console.log("");
        command();
        // rl.question("Thread ID: ", async (threadId) => {
        //   const { messages } = await oapi.getChat(threadId);

        //   if (messages) {
        //     messages.forEach((message) => {
        //       const role = message.role === "user" ? "User" : "Assistant";
        //       console.log(`${role}: ${message.content}`);
        //     });
        //     console.log("");

        //     startChatRun(tempDefaultAssistant, threadId);
        //   } else {
        //     console.log("Chat not found");
        //     console.log("");
        //   }
        //   command();
        // });
        break;

      case "d": // delete a chat
        console.log("Delete chat not implemented yet");
        console.log("");
        command();
        break;

      // OpenAI commands  -----------------------------------------------------------------------------------

      case "la": // list assistants
        (async () => {
          const assistants = await oapi.getAssistants(10);
          console.log("Assistants:");
          assistants.forEach((assistant: Assistant) => {
            console.log(formatAssistantSimple(assistant));
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

      case "ca": // create assistant
        async () => {
          const { name, instructions } = assistants[0];

          const assistant = await oapi.createAssistant(name, instructions);
          if (assistant) {
            console.log("Assistant created:");
            console.log(formatAssistantDetails(assistant));
            console.log("");
          } else {
            console.log("Failed to create assistant");
            console.log("");
          }
          command();
        };
        break;

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

const startChatRun = (assistantId: string, threadId: string) => {
  const chatrun = oapi.createChatRunner(assistantId, threadId);

  chatrun
    .on("user_message_required", (respond) => {
      rl.question(
        chalk.magentaBright.bold("You (:q stops chat) >> "),
        async (input: string) => {
          if (input === ":q") {
            chatrun.stop();
            return;
          }

          console.log("\n");
          respond(input);
        }
      );
    })
    .on("assistant_message_created", () => {
      process.stdout.write(chalk.cyan.bold("Assistant 👾 >> "));
    })
    .on("assistant_message_delta", (text: string) => {
      process.stdout.write(text);
    })
    .on("assistant_message_end", () => {
      console.log("\n");
      console.log("");
    })
    .on("tool_call_created", () => {
      console.log("");
      console.log(chalk.yellow.bold("🔮🔭 RAG ⚗️⚖️"));
      console.log("");
    })
    .on("chat_end", () => {
      console.log("");
      console.log("Chat ended 💬❎");
      console.log("");
      command();
    })
    .on("error", (error) => {
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);
      console.log("");
    });

  chatrun.start();
};

const startChat = () => {
  printCommands();
  command();
};

export { startChat };
