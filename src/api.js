async function fetchPokemonList(offset, limit) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching Pokemon list:', error);
        return [];
    }
}

async function fetchDetailedPokemon(pokemon) {
    try {
        const pokemonResponse = await fetch(pokemon.url);
        if (!pokemonResponse.ok) {
            throw new Error(`HTTP error! status: ${pokemonResponse.status}`);
        }
        const pokemonData = await pokemonResponse.json();
        pokemonDataMap.set(pokemonData.id, pokemonData);
        return pokemonData;
    } catch (error) {
        console.error('Error fetching detailed Pokemon:', error);
        return null;
    }
}

async function fetchEvolutionChain(pokemonId) {
    try {
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}/`);
        const speciesData = await speciesResponse.json();
        const evolutionChainUrl = speciesData.evolution_chain.url;
        const evolutionResponse = await fetch(evolutionChainUrl);
        const evolutionData = await evolutionResponse.json();
        return { evolutionData, speciesData };
    } catch (error) {
        console.error('Error fetching evolution chain:', error);
        return null;
    }
}

async function fetchPokemonData(pokemonId) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`);
        const pokemonData = await response.json();
        pokemonDataMap.set(pokemonData.id, pokemonData);
        return pokemonData;
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
        return null;
    }
}
