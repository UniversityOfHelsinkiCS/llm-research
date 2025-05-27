import { AzureOpenAI } from "openai";
import { getAzureOpenAIClient } from "../azure.ts";

const client = getAzureOpenAIClient();

export const getPokemonTool = {
  description: {
    type: "function",
    function: {
      name: "getPokemon",
      description:
        "Everytime when pokemons are needed, call this function to get details about a pokemon that is related to the context by name. Pass a pokemons name as a parameter you think fits the description.",
      parameters: {
        type: "object",
        properties: {
          pokemon_name: {
            type: "string",
            description: "A pokemons name.",
          },
        },
        required: ["pokemon_name"],
        additionalProperties: false,
      },
    },
  },
  function: async (query: string) => {
    // const response = await fetch(
    //   `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    // );
    // const data = (await response.json()) as {
    //   name: string;
    //   height: number;
    //   weight: number;
    //   types: { type: { name: string } }[];
    //   abilities: { ability: { name: string } }[];
    // };
    // const pokemonData = {
    //   name: data.name,
    //   height: data.height,
    //   weight: data.weight,
    //   types: data.types.map((type) => type.type.name),
    //   abilities: data.abilities.map((ability) => ability.ability.name),
    // };

    console.log("YRITETTY KUTSUA RETRIEVALIA PERKELE");

    let res;

    try {
      res = await client.vectorStores.search("vs_Lsyd0uMbgeT8lS9pnxZQEl3c", {
        query,
      });
    } catch (err) {
      console.error(err);
    }

    return JSON.stringify(res);
  },
};

export const ohtuTool = {
  definition: {
    type: "function",
    name: "ohtu_retrieval",
    description:
      "Helsingin yliopiston ohjelmistotuotannon kurssimateriaalin haku funktio. Kutsu tätä kun käyttäjä haluaa tietoa kurssiin liittyen. Muuten älä kutsu tätä.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Käyttäjän kysymys kurssimateriaalista",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true, // or true, depending on your requirements
  },
  function: async (query: string): Promise<any> => {
    // Simulate a tool function that returns a simple message

    console.log("KUTSUTAAN RAG FUNKTIOTA");

    const indexit = await client.vectorStores.list();
    const vs = indexit.data.filter((index) => index.name === "ohtu-test")[0];

    console.log("INDEX", vs);

    const results = await client.vectorStores.search(vs.id, {
      query,
      max_num_results: 10,
      rewrite_query: true,
      // ranking_options: ''
    });

    // return results
    return results;
  },
};
