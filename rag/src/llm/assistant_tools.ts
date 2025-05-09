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
  function: async (pokemonName: string) => {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    );
    const data = (await response.json()) as {
      name: string;
      height: number;
      weight: number;
      types: { type: { name: string } }[];
      abilities: { ability: { name: string } }[];
    };
    const pokemonData = {
      name: data.name,
      height: data.height,
      weight: data.weight,
      types: data.types.map((type) => type.type.name),
      abilities: data.abilities.map((ability) => ability.ability.name),
    };

    return JSON.stringify(pokemonData);
  },
};
