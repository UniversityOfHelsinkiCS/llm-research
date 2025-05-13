import { Console } from "console";
import fs from "fs";

/**
 * Logs a custom message to a specified file.
 *
 * @param message The message to log to the file.
 * @param filePath The path to the log file (e.g., /tmp/data).
 */
export function writeSteam(
  message: string,
  type: "event" | "rag_output"
): void {
  let filePath = "";

  if (type === "event") {
    filePath = "src/llm/openai/tmp/event.log";
  } else if (type === "rag_output") {
    filePath = "src/llm/openai/tmp/rag_output.log";
  }

  const output = fs.createWriteStream(filePath, { flags: "a" }); // 'a' = append mode
  const fileConsole = new Console(output, output);

  fileConsole.log(message); // Write custom message to file
}

export function emptyTmp(): void {
  const eventFilePath = "src/llm/openai/tmp/event.log";
  const ragOutputFilePath = "src/llm/openai/tmp/rag_output.log";

  fs.writeFile(eventFilePath, "", (err) => {
    if (err) throw err;
  });

  fs.writeFile(ragOutputFilePath, "", (err) => {
    if (err) throw err;
  });
}
