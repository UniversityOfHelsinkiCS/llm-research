import { getAzureOpenAIClient } from "../azure.ts";
import type OpenAI from "openai";
import fs, { write } from "fs";
import type { Thread } from "openai/resources/beta/threads/threads";
import type { Assistant } from "openai/resources/beta/assistants.mjs";

interface ChatData {
  thread_id: string;
  assistant_id: string;
  assistant_name: string;
  created_at: string;
}

export default class OpenAIService {
  private openai: OpenAI;
  private chat_file: string;

  constructor() {
    this.openai = getAzureOpenAIClient();
    this.chat_file = "./src/llm/openai/data/chats.json";
  }

  /**
   * Creates a new chat for a given assistant and starts a conversation.
   * @param assistantId - The ID of the assistant to create a chat for
   */
  createChat = async (assistantId: string) => {
    try {
      const thread = await this.openai.beta.threads.create();
      const assistant = await this.openai.beta.assistants.retrieve(assistantId);

      const chatData: ChatData = {
        thread_id: thread.id,
        assistant_id: assistant.id,
        assistant_name: assistant.name,
        created_at: new Date().toISOString(),
      };

      this.writeJsonFile(this.chat_file, chatData);
    } catch (err) {
      console.error("Error creating chat:", err);
      return null;
    }
  };

  /**
   * Starts a chat with a given assistant and thread ID.
   * @param assistantId - The ID of the assistant to start a chat with
   * @param threadId - The ID of the thread to start a chat in
   */
  startChat = async (assistantId: string, threadId: string) => {};

  /**
   * This method retrieves a list of assistants from Azure OpenAI.
   * @param limit - The number of assistants to retrieve
   * @returns - A promise that resolves to an array of Assistant objects
   */
  getAssistants = async (limit: number): Promise<Assistant[]> => {
    try {
      const assistants = await this.openai.beta.assistants.list({
        limit,
        order: "desc",
      });
      return assistants.data;
    } catch (err) {
      console.error("Error fetching assistants:", err);
      return [];
    }
  };

  addMessageToThread = async (threadId: string, content: string) => {
    try {
      return await this.openai.beta.threads.messages.create(threadId, {
        role: "user",
        content,
      });
    } catch (err) {
      console.error("Error adding message to thread");
      return null;
    }
  };

  getMessagesFromThread = async (threadId: string) => {
    try {
      const threadMessages = await this.openai.beta.threads.messages.list(
        threadId,
        { order: "asc" }
      );

      return threadMessages.data.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        assistantId: message.assistant_id,
      }));
    } catch (err) {
      console.error("Error fetching messages from thread");
      return null;
    }
  };

  createRun = (threadId: string, assistantId: string) => {
    try {
      return this.openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
      });
    } catch (err) {
      console.error("Error creating run");
      return null;
    }
  };

  cancelRun = async (threadId: string, runId: string) => {
    return await this.openai.beta.threads.runs.cancel(threadId, runId);
  };

  writeJsonFile = async (file: string, jsonData: ChatData) => {
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
      console.log("File written (merged) successfully.");
    } catch (err) {
      console.error("Error writing file:", err);
    }
  };
}
