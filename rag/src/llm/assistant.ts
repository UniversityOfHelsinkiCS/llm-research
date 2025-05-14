import type OpenAI from "openai";
import type { AssistantTool } from "openai/resources/beta/assistants.mjs";
import { EventEmitter } from "events";
import { getPokemonTool } from "./openai/assistantTools.ts";

/*
DEPRECATED: REMOVE WHEN NOT NEEDED IN ragUse.ts MODULE
 */

export const startAssistant = async (
  instructions: string,
  prompt: string,
  openai: OpenAI,
  model: string
) => {
  const tools: AssistantTool[] = [getPokemonTool.description as AssistantTool];

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
};

class EventHandler extends EventEmitter {
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    super();
    this.openai = openai;
  }

  async onEvent(event) {
    // console.log("Event type:", event.event);

    try {
      switch (event.event) {
        case "thread.message.created":
          process.stdout.write(" 🤖 Assistant >> ");
          break;
        case "thread.message.delta":
          process.stdout.write(event.data.delta.content[0].text.value || "");
          break;
        case "thread.run.requires_action":
          await this.handleRequiresAction(
            event.data,
            event.data.id,
            event.data.thread_id
          );
          break;
        default:
          break;
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

              let answer = "";
              try {
                answer = await getPokemonTool.function(argument);
              } catch (error) {
                console.error("Error calling getPokemon:", argument);
              }

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

  async submitToolOutputs(toolOutputs, runId: string, threadId: string) {
    try {
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
