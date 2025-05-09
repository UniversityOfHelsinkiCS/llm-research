import { getAzureOpenAIClient } from "../azure.ts";
import type OpenAI from "openai";
import fs from "fs";
import type { Thread } from "openai/resources/beta/threads/threads";
import type { Assistant } from "openai/resources/beta/assistants.mjs";

export default class OpenAIService {
  openai: OpenAI;
  path: string;

  constructor() {
    this.openai = getAzureOpenAIClient();
    this.path = "./src/llm/openai/data/threads.json";
  }

  // ASSISTANT HANDLING -------------------------------------------------------------------
  getAssistants = async (limit: number): Promise<Assistant[]> => {
    const assistants = await this.openai.beta.assistants.list({
      limit,
      order: "desc",
    });
    return assistants.data;
  };

  // THREAD HANDLING ----------------------------------------------------------------------
  saveThread = (thread: Thread) => {
    const newEntry = {
      id: thread.id,
      created_at: thread.created_at,
    };

    // Read existing file (or start with an empty array if file doesn't exist)
    let existingData = [];
    if (fs.existsSync(this.path)) {
      const fileContent = fs.readFileSync(this.path, "utf-8");
      try {
        existingData = JSON.parse(fileContent);
        if (!Array.isArray(existingData)) existingData = [];
      } catch (err) {
        console.error("Invalid JSON, resetting to empty array.");
        existingData = [];
      }
    }

    // Add new entry
    existingData.push(newEntry);

    // Write updated array back to file
    try {
      fs.writeFileSync(this.path, JSON.stringify(existingData, null, 2));
      return true;
    } catch (err) {
      console.error("Error writing file:", err);
      return false;
    }
  };

  deleteThread = async (threadId: string) => {
    if (!fs.existsSync(this.path)) {
      console.error("File does not exist.");
      return false;
    }

    let threads;
    try {
      const fileContent = fs.readFileSync(this.path, "utf-8");
      threads = JSON.parse(fileContent);

      if (!Array.isArray(threads)) {
        console.error("JSON is not an array.");
        return false;
      }
    } catch (err) {
      console.error("Error reading or parsing file:", err);
      return false;
    }

    // Filter out the thread to be deleted
    const updatedThreads = threads.filter((thread) => thread.id !== threadId);

    // Write updated array back and delete the thread
    try {
      fs.writeFileSync(this.path, JSON.stringify(updatedThreads, null, 2));
    } catch (err) {
      console.error("Error writing file:", err);
      return false;
    }

    // delete from openai
    try {
      await this.openai.beta.threads.del(threadId);
      console.log("Thread deleted from OpenAI successfully!");
    } catch (err) {
      console.error("Error deleting thread from OpenAI:", err);
    }

    return true;
  };

  getThreads = () => {
    if (!fs.existsSync(this.path)) {
      console.warn("No threads file found.");
      return [];
    }

    try {
      const fileContent = fs.readFileSync(this.path, "utf-8");
      const threads = JSON.parse(fileContent);

      if (!Array.isArray(threads)) {
        console.error("Invalid format: threads.json should contain an array.");
        return [];
      }

      return threads;
    } catch (err) {
      console.error("Error reading or parsing threads file:", err);
      return [];
    }
  };

  createThread = async () => {
    const thread = await this.openai.beta.threads.create();
    const success = this.saveThread(thread);
    if (success) return thread;
    else {
      await this.openai.beta.threads.del(thread.id);
      console.error("Failed to save thread locally, deleted from OpenAI.");
      return null;
    }
  };

  // MESSAGE HANDLING -----------------------------------------------------------------
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
        {
          limit: 10,
          order: "asc",
        }
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

  // RUN HANDLING -----------------------------------------------------------------
  createRun = (threadId: string, assistantId: string) => {
    try {
      return this.openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
        metadata: {
          assistant_id: assistantId,
        },
      });
    } catch (err) {
      console.error("Error creating run");
      return null;
    }
  };

  cancelRun = async (threadId: string, runId: string) => {
    return await this.openai.beta.threads.runs.cancel(threadId, runId);
  };
}
