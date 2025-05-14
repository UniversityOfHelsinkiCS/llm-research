import { Console } from "console";
import fs from "fs";
import type { AssistantStreamEvent } from "openai/resources/beta/assistants.mjs";
import type { RunSubmitToolOutputsParamsStreaming } from "openai/resources/beta/threads/runs/runs.mjs";

const eventFilePath = "src/llm/openai/tmp/event.log";
const ragOutputFilePath = "src/llm/openai/tmp/rag_output.log";

export function writeSteam(message: string, filePath: string): void {
  const output = fs.createWriteStream(filePath, { flags: "a" }); // 'a' = append mode
  const fileConsole = new Console(output, output);
  fileConsole.log(message);
}

export function logEvent(event: AssistantStreamEvent): void {
  writeSteam(event.event, eventFilePath);
}

export function logRagOutput(
  toolOutputs: RunSubmitToolOutputsParamsStreaming["tool_outputs"]
): void {
  const message = toolOutputs.map((toolOutput) => {
    return JSON.parse(toolOutput.output);
  });

  writeSteam(JSON.stringify(message, null, 2), ragOutputFilePath);
}

export function emptyTmp(): void {
  fs.writeFile(eventFilePath, "", (err) => {
    if (err) throw err;
  });

  fs.writeFile(ragOutputFilePath, "", (err) => {
    if (err) throw err;
  });
}
