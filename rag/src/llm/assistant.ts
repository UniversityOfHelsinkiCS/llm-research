import type OpenAI from "openai";
import type { AssistantTool } from "openai/resources/beta/assistants.mjs";
import { EventEmitter } from "events";

const tools: AssistantTool[] = [
  {
    type: "function",
    function: {
      name: "getPokemon",
      description:
        "Everytime when pokemons are mentioned, call this function to get details about a pokemon that is related to the context by name. Pass a pokemons name as a parameter you think fits the description.",
      parameters: {
        type: "object",
        properties: {
          pokemon_name: {
            type: "string",
            description: "A pokemons name.",
          },
        },
        required: ["pokemon_name"],
        // additionalProperties: false,
      },
    },
  },
];

export const startAssistant = async (
  instructions: string,
  prompt: string,
  openai: OpenAI,
  model: string
) => {
  const assistant = await openai.beta.assistants.create({
    name: "CurreChat",
    instructions,
    model,
    tools,
  });

  const thread = await openai.beta.threads.create();
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt,
  });

  const eventHandler = new EventHandler(openai);
  eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));

  const stream = openai.beta.threads.runs.stream(
    thread.id,
    { assistant_id: assistant.id },
    eventHandler as any
  );

  for await (const event of stream) {
    eventHandler.emit("event", event);
  }

  // const run = openai.beta.threads.runs
  //   .stream(thread.id, {
  //     assistant_id: assistant.id,
  //   })
  //   .on("textCreated", (text) => process.stdout.write(" 🤖 >> "))
  //   .on("textDelta", (textDelta, snapshot) =>
  //     process.stdout.write(textDelta.value || "")
  //   )
  //   .on("toolCallCreated", (toolCall) =>
  //     process.stdout.write(`\ 🤖 >> ${toolCall.type}\n\n`)
  //   )
  //   .on("toolCallDelta", (toolCallDelta, snapshot) => {
  //     if (toolCallDelta.type === "code_interpreter") {
  //       if (toolCallDelta.code_interpreter?.input) {
  //         process.stdout.write(toolCallDelta.code_interpreter.input);
  //       }
  //       if (toolCallDelta.code_interpreter?.outputs) {
  //         process.stdout.write("\noutput >\n");
  //         toolCallDelta.code_interpreter.outputs.forEach((output) => {
  //           if (output.type === "logs") {
  //             process.stdout.write(`\n${output.logs}\n`);
  //           }
  //         });
  //       }
  //     }
  //   });
};

class EventHandler extends EventEmitter {
  private openai: any;

  constructor(openai: any) {
    super();
    this.openai = openai;
  }

  async onEvent(event) {
    try {
      console.log("do", event.event);

      if (event.event === "thread.message.created") {
      }
      if (event.event === "thread.run.requires_action") {
        console.log("Requires action event received:", event);
        await this.handleRequiresAction(
          event.data,
          event.data.id,
          event.data.thread_id
        );
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  async handleRequiresAction(data, runId, threadId) {
    try {
      const toolOutputs = await Promise.all(
        data.required_action.submit_tool_outputs.tool_calls.map(
          async (toolCall) => {
            if (toolCall.function.name === "getPokemon") {
              const argument = JSON.parse(
                toolCall.function.arguments
              ).pokemon_name;

              const answer = await getPokemon(argument);
              console.log("Answer:", answer);

              return {
                tool_call_id: toolCall.id,
                output: answer,
              };
            }
          }
        )
      );

      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.openai.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs }
      );
      for await (const event of stream) {
        this.emit("event", event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }
}

const getPokemon = async (pokemonName: string) => {
  // Simulate an API call to get the Pokemon data
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
  );
  const data = (await response.json()) as {
    name: string;
    height: number;
    weight: number;
    types: { type: { name: string } }[];
    abilities: { ability: { name: string } }[];
  };
  const pokemonData = {
    name: data.name,
    height: data.height,
    weight: data.weight,
    types: data.types.map((type) => type.type.name),
    abilities: data.abilities.map((ability) => ability.ability.name),
  };

  return JSON.stringify(pokemonData, null, 2);
};
