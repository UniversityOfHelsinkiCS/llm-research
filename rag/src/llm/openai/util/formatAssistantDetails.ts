import type { Assistant } from "openai/resources/beta/assistants.mjs";

export function formatAssistantSimple(data: Assistant): string {
  const { id, name, model, created_at } = data;
  return `ID: ${id}\nName: ${name}\nModel: ${model}\nCreated At: ${new Date(
    created_at * 1000
  ).toLocaleString()}`;
}

export function formatAssistantDetails(data: Assistant): string {
  const {
    id,
    name,
    model,
    instructions,
    tools,
    created_at,
    description,
    temperature,
    top_p,
  } = data;

  const lines: string[] = [];

  lines.push("=== Assistant Details ===");
  lines.push(`ID:           ${id}`);
  lines.push(`Name:         ${name}`);
  lines.push(`Model:        ${model}`);
  lines.push(`Created At:   ${new Date(created_at * 1000).toLocaleString()}`);
  lines.push(`Temperature:  ${temperature}`);
  lines.push(`Top P:        ${top_p}`);
  lines.push(`Description:  ${description ?? "None"}`);
  lines.push(`Instructions:\n${instructions}\n`);

  if (Array.isArray(tools) && tools.length > 0) {
    lines.push("Tools:");
    tools.forEach((tool, index) => {
      const fn = (tool as any).function;

      if (!fn) {
        lines.push(`  Tool ${index + 1}: <undefined function>`);
        return;
      }

      lines.push(`  Tool ${index + 1}: ${fn.name ?? "<no name>"}`);
      lines.push(`    Description: ${fn.description ?? "<no description>"}`);
      lines.push(`    Parameters:`);

      const properties = fn.parameters?.properties ?? {};
      for (const [key, value] of Object.entries(properties)) {
        const typedValue = value as { type: string; description: string };
        lines.push(
          `      - ${key} (${typedValue.type ?? "unknown"}): ${
            typedValue.description ?? "No description"
          }`
        );
      }
    });
  } else {
    lines.push("Tools: None");
  }

  return lines.join("\n");
}
