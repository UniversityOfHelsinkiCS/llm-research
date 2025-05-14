import { getPokemonTool } from "./assistantTools.ts";
import { emptyTmp, writeSteam } from "./util/writeStream.ts";
import OpenAIService from "./OpenAIService.ts";
import type {
  RequiredActionFunctionToolCall,
  Run,
  RunSubmitToolOutputsParamsStreaming,
} from "openai/resources/beta/threads/runs/runs.mjs";
import type { AssistantStream } from "openai/lib/AssistantStream.mjs";

type Events =
  | "user_message_required"
  | "assistant_message_created"
  | "assistant_message_delta"
  | "assistant_message_end"
  | "tool_call_created"
  | "chat_end"
  | "error";

export default class ChatRunner {
  private oapi: OpenAIService;
  private events: { [key: string]: Function[] };
  assistantId: string;
  threadId: string;

  constructor(parent: OpenAIService, assistantId: string, threadId: string) {
    this.oapi = parent;
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

  private _emit(event: Events, data?: any) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(data));
    }
  }

  async start() {
    const message = await this._waitForUserMessage();
    await this.oapi.addMessageToThread(this.threadId, message);

    const stream = this.oapi.createStream(this.threadId, this.assistantId);
    this._run(stream);
  }

  private _waitForUserMessage(): Promise<string> {
    return new Promise((resolve) => {
      this._emit("user_message_required", (input: string) => {
        resolve(input);
      });
    });
  }

  stop() {
    this._emit("chat_end");
  }

  private async _run(stream: AssistantStream) {
    for await (const event of stream) {
      writeSteam(event.event, "event"); // in new terminal: tail -f src/llm/openai/tmp/event.log

      try {
        switch (event.event) {
          case "thread.message.created":
            this._emit("assistant_message_created");
            break;

          case "thread.message.delta":
            if ("text" in event.data.delta.content[0]) {
              this._emit(
                "assistant_message_delta",
                event.data.delta.content[0].text.value
              );
            }
            break;

          case "thread.message.completed":
            this._emit("assistant_message_end");
            this.start(); // start again
            break;

          case "thread.run.requires_action":
            this._emit("tool_call_created");
            await this.handleRequiresAction(
              event.data,
              event.data.id,
              event.data.thread_id
            );
            break;

          case "thread.run.failed":
            this._emit("error", event.data.last_error);

          case "thread.run.completed":
            emptyTmp(); // empty the tmp files
            break;
        }
      } catch (error) {
        console.error("Error handling event:", error);
      }
    }
  }

  async handleRequiresAction(data: Run, runId: string, threadId: string) {
    try {
      const toolOutputs = await Promise.all(
        data.required_action.submit_tool_outputs.tool_calls.map(
          async (toolCall: RequiredActionFunctionToolCall) => {
            switch (toolCall.function.name) {
              case "getPokemon":
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

              default:
                throw new Error(
                  `Unknown function name: ${toolCall.function.name}`
                );
            }
          }
        )
      );

      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(runId, threadId, toolOutputs);
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  async submitToolOutputs(
    runId: string,
    threadId: string,
    toolOutputs: RunSubmitToolOutputsParamsStreaming["tool_outputs"]
  ) {
    try {
      const stream = this.oapi.submitToolOutputsStream(threadId, runId, {
        tool_outputs: toolOutputs,
        stream: true, // Ensure the 'stream' property is included
      });

      this._run(stream);
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }
}
