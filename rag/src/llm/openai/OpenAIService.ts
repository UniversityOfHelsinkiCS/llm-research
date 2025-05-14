import fs from "fs";
import { getPokemonTool } from "./assistantTools.ts";
import { getAzureOpenAIClient } from "../azure.ts";
import ChatRunner from "./ChatRunner.ts";

import type {
  Assistant,
  AssistantTool,
} from "openai/resources/beta/assistants.mjs";
import type { Thread } from "openai/resources/beta/threads/threads";
import type {
  Message,
  MessageContent,
} from "openai/resources/beta/threads/messages.mjs";
import type { CursorPage } from "openai/pagination.mjs";
import type { Run } from "openai/resources/beta/threads/runs/runs.mjs";
import type { AssistantStream } from "openai/lib/AssistantStream.mjs";
import type { RunSubmitToolOutputsParamsStreaming } from "openai/resources/beta/threads/runs/runs.mjs";

const openai = getAzureOpenAIClient();

export interface ChatData {
  thread_id: string;
  assistant_id: string;
  assistant_name: string;
  created_at: string;
}

export interface AssistantData {
  name: string;
  instructions: string;
}

export default class OpenAIService {
  private chat_file: string;

  constructor() {
    this.chat_file = "./src/llm/openai/data/chats.json";
  }

  createChat = async (
    assistantId: string
  ): Promise<{
    threadId: string;
    assistantId: string;
  }> => {
    let thread: Thread | null = null;

    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      thread = await openai.beta.threads.create();

      // BEN: IMPLEMENT AFTER FUNCTION CALLING WORKS
      // const chatData: ChatData = {
      //   thread_id: thread.id,
      //   assistant_id: assistant.id,
      //   assistant_name: assistant.name,
      //   created_at: new Date().toISOString(),
      // };

      // this._writeJsonFile(this.chat_file, chatData);

      return { threadId: thread.id, assistantId: assistant.id };
    } catch (err) {
      // delete thread if failed to create chat
      if (thread) await openai.beta.threads.del(thread.id);

      console.error("Error creating chat:", err);
    }
  };

  getChat = async (
    threadId: string
  ): Promise<{
    threadId: string;
    messages: {
      id: string;
      role: string;
      content: MessageContent[];
      created_at: string;
    }[];
  }> => {
    try {
      const thread = await openai.beta.threads.retrieve(threadId);
      const messagesRaw: CursorPage<Message> = await this.getMessagesFromThread(
        threadId
      );

      const messages = messagesRaw.data.map((message) => {
        return {
          id: message.id,
          role: message.role,
          content: message.content,
          created_at: new Date(message.created_at * 1000).toLocaleString(),
        };
      });

      return { threadId: thread.id, messages };
    } catch (err) {
      console.error("Error fetching chat:", err);
    }
  };

  getAssistants = async (limit: number): Promise<Assistant[]> => {
    try {
      const assistants = await openai.beta.assistants.list({
        limit,
        order: "desc",
      });
      return assistants.data;
    } catch (err) {
      console.error("Error fetching assistants:", err);
      return [];
    }
  };

  getAssistant = async (assistantId: string): Promise<Assistant> => {
    try {
      return await openai.beta.assistants.retrieve(assistantId);
    } catch (err) {
      console.error("Error fetching assistant:", err);
    }
  };

  createAssistant = async (
    name: string,
    instructions: string,
    model: string = process.env.GPT_4O_MINI
  ): Promise<Assistant> => {
    try {
      return await openai.beta.assistants.create({
        name,
        instructions,
        model,
        tools: [getPokemonTool.description] as AssistantTool[],
      });
    } catch (err) {
      console.error("Error creating assistant:", err);
    }
  };

  deleteAssistant = async (assistantId: string): Promise<void> => {
    try {
      await openai.beta.assistants.del(assistantId);
    } catch (err) {
      console.error("Error deleting assistant:", err);
    }
  };

  addMessageToThread = async (
    threadId: string,
    content: string
  ): Promise<Message> => {
    try {
      return await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content,
      });
    } catch (err) {
      console.error("Error adding message to thread");
    }
  };

  getMessagesFromThread = async (
    threadId: string
  ): Promise<CursorPage<Message>> => {
    try {
      return await openai.beta.threads.messages.list(threadId, {
        order: "asc",
      });
    } catch (err) {
      console.error("Error fetching messages from thread");
    }
  };

  deleteMessageFromThread = async (
    threadId: string,
    messageId: string
  ): Promise<void> => {
    try {
      await openai.beta.threads.messages.del(threadId, messageId);
    } catch (err) {
      console.error("Error deleting message from thread");
    }
  };

  createStream = (threadId: string, assistantId: string): AssistantStream => {
    try {
      return openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
      });
    } catch (err) {
      console.error("Error creating run:", err);
    }
  };

  cancelStream = async (threadId: string, runId: string): Promise<Run> => {
    try {
      return await openai.beta.threads.runs.cancel(threadId, runId);
    } catch (err) {
      console.error("Error canceling run:", err);
    }
  };

  submitToolOutputsStream = (
    threadId: string,
    runId: string,
    toolOutputs: RunSubmitToolOutputsParamsStreaming
  ): AssistantStream => {
    try {
      return openai.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        toolOutputs
      );
    } catch (err) {
      console.error("Error canceling run:", err);
    }
  };

  private _writeJsonFile = async (
    file: string,
    jsonData: ChatData
  ): Promise<void> => {
    try {
      let existingData = {};

      try {
        const fileContent = await fs.promises.readFile(file, "utf8");
        existingData = JSON.parse(fileContent);
      } catch (err) {
        // If file doesn't exist or is empty/corrupted, start fresh
        if (err.code !== "ENOENT") throw err;
      }

      const mergedData = {
        ...existingData,
        ...jsonData, // new data overwrites existing fields
      };

      const jsonString = JSON.stringify(mergedData, null, 2);
      await fs.promises.writeFile(file, jsonString, "utf8");
    } catch (err) {
      console.error("Error writing file:", err);
    }
  };

  createChatRunner(assistantId: string, threadId: string): ChatRunner {
    return new ChatRunner(this, assistantId, threadId);
  }
}
