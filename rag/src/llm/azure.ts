import { AzureOpenAI } from "openai";

export const getAzureOpenAIClient = () => {
  const endpoint = `https://${process.env.AZURE_RESOURCE}.openai.azure.com/`;
  
  const deployment = process.env.GPT_4O;
  const apiVersion = "2025-03-01-preview";
  return new AzureOpenAI({
    apiKey: process.env.AZURE_API_KEY,
    deployment,
    apiVersion,
    endpoint,
  });
}
