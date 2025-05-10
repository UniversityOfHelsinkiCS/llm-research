import type OpenAI from "openai";
import { EventEmitter } from "events";
import { getPokemonTool } from "./assistantTools.ts";
import { getAzureOpenAIClient } from "../azure.ts";
const openai = getAzureOpenAIClient();

type Events =
  | "openai_event"
  | "user_message_input"
  | "assistant_message_created"
  | "assistant_message_delta"
  | "function_call"
  | "function_response"
  | "error";

export default class ChatRunner {
  private events: { [key: string]: Function[] };
  assistantId: string;
  threadId: string;

  constructor(assistantId: string, threadId: string) {
    this.events = {};
    this.assistantId = assistantId;
    this.threadId = threadId;
  }

  on(event: Events, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    return this; // Return the instance for function chaining
  }

  private emit(event: Events, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(data));
    }
  }

  async start() {
    if (!this.threadId) {
      this.emit("error", { error: "Missing threadId" });
      return false;
    }

    this.emit("user_message_input");

    const eventHandler = new EventHandler(openai);
    eventHandler.on("openai_event", eventHandler.onEvent.bind(eventHandler));

    const stream = openai.beta.threads.runs.stream(
      this.threadId,
      { assistant_id: this.assistantId },
      eventHandler as any
    );

    for await (const event of stream) {
      eventHandler.emit("openai_event", event);
    }
  }

  async addMessage(message: string) {
    console.log("Adding message:", message);
  }
}

class EventHandler extends EventEmitter {
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    super();
    openai = openai;
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
      const stream = openai.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs }
      );
      for await (const event of stream) {
        this.emit("openai_event", event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }
}
