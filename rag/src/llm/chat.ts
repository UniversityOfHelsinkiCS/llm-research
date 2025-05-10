import type { Assistant } from "openai/resources/beta/assistants";
import OpenAIService, { type AssistantData } from "./openai/OpenAIService.ts";
import { formatAssistantDetails } from "./openai/util/formatAssistantDetails.ts";
import readline from "readline";

const oapi = new OpenAIService();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function printCommands() {
  console.log("=========================================");
  console.log("");
  console.log("CHAT COMMANDS 💬 -----------------------------");
  console.log("s - start new chat");
  console.log("l - list all chats");
  console.log("o - open old chat");
  console.log("d - delete a chat");
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

      case "s": // start new chat
        (async () => {
          const { assistantId, threadId } = await oapi.createChat(
            tempDefaultAssistant
          );

          startChatRun(assistantId, threadId);
        })();
        break;

      case "l": // list all chats
        console.log("List of chats not implemented yet");
        console.log("");
        break;

      case "o": // open old chat
        rl.question("Thread ID: ", async (threadId) => {
          const { messages } = await oapi.getChat(threadId);

          if (messages) {
            messages.forEach((message) => {
              const role = message.role === "user" ? "User" : "Assistant";
              console.log(`${role}: ${message.content}`);
            });
            console.log("");

            startChatRun(tempDefaultAssistant, threadId);
          } else {
            console.log("Chat not found");
            console.log("");
          }
          command();
        });
        break;

      case "d": // delete a chat
        console.log("Delete chat not implemented yet");
        console.log("");
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

const startChatRun = (assistantId: string, threadId: string) => {
  const chatrun = new oapi.ChatRunner(assistantId, threadId);

  chatrun
    .on("user_message_input", () => {
      rl.question("Message (:q stops chat): ", async (input: string) => {
        if (input === ":q") {
          console.log("Chat stopped 💬❎");
          console.log("");
          command();
          return;
        } else {
          console.log("Message received");
          // chatrun.addMessage(input);
        }
      });
    })
    .on("assistant_message_created", (message: string) => {
      console.log("Assistant message created:", message);
    })
    .on("assistant_message_delta", (message: string) => {
      console.log("Assistant message delta:", message);
    })
    .on("function_call", (functionCall) => {
      console.log("Function call:", functionCall);
    })
    .on("function_response", (functionResponse) => {
      console.log("Function response:", functionResponse);
    })
    .on("error", (error) => {
      console.error("Error:", error);
    });

  chatrun.start();
};

const startChat = () => {
  printCommands();
  command();
};

export { startChat };
