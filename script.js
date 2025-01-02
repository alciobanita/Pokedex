const pokemonGrid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('search');
const loadMoreButton = document.getElementById('load-more');
const loadingScreen = document.getElementById('loading-screen');

let offset = 0;
const limit = 30;
const pokemonDataMap = new Map();

window.loadMorePokemon = async function () {
    try {
        offset += limit;
        await displayPokemon(offset, limit);
    } catch (error) {
        console.error('Error loading more Pokemon:', error);
    }
};

async function fetchPokemon(offset, limit) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';

    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const pokemonList = await fetchPokemonList(offset, limit);
        return await Promise.all(pokemonList.map(fetchDetailedPokemon));
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
    } finally {
        loadingScreen.style.display = 'none';
    }
}

function createPokemonInfo(pokemon) {
    const info = document.createElement('div');
    info.classList.add('pokemon-info', 'text-center');
    const number = createPokemonNumber(pokemon.id);
    const name = createPokemonName(pokemon.name);
    info.appendChild(number);
    info.appendChild(name);
    info.appendChild(createTypes(pokemon.types));
    return info;
}

function createPokemonNumber(id) {
    const number = document.createElement('p');
    number.textContent = `N°${id}`;
    number.classList.add('pokemon-number');
    return number;
}

function createPokemonName(name) {
    const nameElement = document.createElement('h5');
    nameElement.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    nameElement.classList.add('pokemon-name');
    return nameElement;
}

function createTypes(types) {
    const typesContainer = document.createElement('div');
    typesContainer.classList.add('pokemon-types', 'd-flex', 'justify-content-center', 'mt-2');
    types.forEach(type => {
        const typeLabel = createTypeLabel(type);
        typesContainer.appendChild(typeLabel);
    });
    return typesContainer;
}

function createTypeLabel(type) {
    const typeLabel = document.createElement('span');
    typeLabel.textContent = type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1);
    typeLabel.classList.add('type-label', `type-${type.type.name}`, 'badge', 'me-1');
    return typeLabel;
}

function createEvolutionElement(evolution) {
    const evolutionDiv = document.createElement('div');
    evolutionDiv.classList.add('evolution');
    const { levelContainer, nameElement } = createEvolutionContent(evolution);
    evolutionDiv.appendChild(levelContainer);
    setupEvolutionClick(evolutionDiv, evolution);
    return evolutionDiv;
}

function createEvolutionContent(evolution) {
    const levelContainer = document.createElement('div');
    levelContainer.classList.add('level-container');
    const image = createEvolutionImage(evolution);
    const nameElement = createEvolutionName(evolution);
    levelContainer.appendChild(image);
    levelContainer.appendChild(nameElement);
    return { levelContainer, nameElement };
}

function createEvolutionImage(evolution) {
    const speciesId = getSpeciesId(evolution);
    const pokemon = pokemonDataMap.get(parseInt(speciesId));
    const image = document.createElement('img');

    if (pokemon && pokemon.sprites && pokemon.sprites.front_default) {
        image.src = pokemon.sprites.front_default;
    } else {
        image.src = '/placeholder.svg?height=100&width=100';
    }

    image.alt = evolution.species.name;
    image.classList.add('evolution-image');
    return image;
}

function createEvolutionName(evolution) {
    const nameElement = document.createElement('div');
    nameElement.textContent = evolution.species.name.charAt(0).toUpperCase() + evolution.species.name.slice(1);
    nameElement.classList.add('evolution-name');
    return nameElement;
}

function setupEvolutionClick(evolutionDiv, evolution) {
    evolutionDiv.addEventListener('click', () => {
        const speciesId = getSpeciesId(evolution);
        const pokemonToDisplay = pokemonDataMap.get(parseInt(speciesId));
        if (pokemonToDisplay) {
            displayPokemonDetails(pokemonToDisplay);
        }
    });
}

async function displayPokemonDetails(pokemon) {
    try {
        const detailsContainer = document.getElementById('pokemon-details');
        const overlay = document.getElementById('overlay');
        setupDetailsContainer(pokemon, detailsContainer, overlay);
        await updatePokemonDetails(pokemon, detailsContainer);
        setupDetailButtons(pokemon, detailsContainer, overlay);
    } catch (error) {
        console.error('Error displaying Pokemon details:', error);
    }
}

function setupDetailsContainer(pokemon, detailsContainer, overlay) {
    detailsContainer.style.display = 'block';
    overlay.style.display = 'block';
    const typeColors = pokemon.types.map(type => `var(--${type.type.name}-light)`);
    setDetailsBackground(detailsContainer, typeColors);
}

function setDetailsBackground(detailsContainer, typeColors) {
    detailsContainer.style.background = typeColors.length > 1
        ? `linear-gradient(135deg, ${typeColors.join(', ')}, black)`
        : `linear-gradient(135deg, ${typeColors[0]}, black)`;
}

async function updatePokemonDetails(pokemon, detailsContainer) {
    try {
        const evolutionDataResponse = await fetchEvolutionChain(pokemon.id);
        if (!evolutionDataResponse) {
            throw new Error('Failed to fetch evolution chain');
        }
        const { evolutionData, speciesData } = evolutionDataResponse;
        const { typesHTML } = createBasicInfo(pokemon, speciesData);
        updateDetailsHTML(pokemon, typesHTML, detailsContainer);
        await handleEvolutionChain(evolutionData);
    } catch (error) {
        console.error('Error updating Pokemon details:', error);
    }
}

function createBasicInfo(pokemon, speciesData) {
    const typesHTML = createTypesHTML(pokemon);
    return { typesHTML };
}

function setupTabEventListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(tab).classList.add('active');
        });
    });
}

async function handleEvolutionChain(evolutionData) {
    if (!evolutionData) return;

    const evolutionContainer = document.getElementById('evolution-container');
    evolutionContainer.innerHTML = '';

    const allEvolutions = [];
    collectEvolutions(evolutionData.chain, allEvolutions);

    for (const evolution of allEvolutions) {
        const speciesId = getSpeciesId(evolution);
        if (!pokemonDataMap.has(parseInt(speciesId))) {
            try {
                const pokemonData = await fetchPokemonData(speciesId);
                pokemonDataMap.set(parseInt(speciesId), pokemonData);
            } catch (error) {
                console.error(`Error fetching Pokemon ${speciesId}:`, error);
            }
        }
    }

    await displayEvolutions(allEvolutions, evolutionContainer);
}

function collectEvolutions(chain, allEvolutions) {
    if (chain) {
        allEvolutions.push(chain);
        chain.evolves_to.forEach(evo => collectEvolutions(evo, allEvolutions));
    }
}

async function displayEvolutions(allEvolutions, container) {
    try {
        for (const evolution of allEvolutions) {
            const evolutionElement = createEvolutionElement(evolution);
            container.appendChild(evolutionElement);
        }
    } catch (error) {
        console.error('Error displaying evolutions:', error);
    }
}

function setupDetailButtons(pokemon, detailsContainer, overlay) {
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const closeButton = document.getElementById('close-button');
    setupNavigationButtons(prevButton, nextButton, pokemon.id);
    setupButtonListeners(prevButton, nextButton, closeButton, pokemon.id, detailsContainer, overlay);
}

function setupNavigationButtons(prevButton, nextButton, currentId) {
    prevButton.disabled = currentId === 1;
    nextButton.disabled = currentId === 898;
}

function setupButtonListeners(prevButton, nextButton, closeButton, currentId, detailsContainer, overlay) {
    prevButton.addEventListener('click', () => handleNavigation(currentId - 1));
    nextButton.addEventListener('click', () => handleNavigation(currentId + 1));
    closeButton.addEventListener('click', () => {
        detailsContainer.style.display = 'none';
        overlay.style.display = 'none';
    });
}

async function handleNavigation(id) {
    if (id < 1 || id > 898) return;
    try {
        const pokemon = await fetchPokemonData(id);
        if (pokemon) await displayPokemonDetails(pokemon);
    } catch (error) {
        console.error(`Error fetching Pokemon ${id}:`, error);
    }
}

async function displayPokemon(offset, limit) {
    try {
        const pokemonList = await fetchPokemon(offset, limit);
        if (!pokemonList || pokemonList.length === 0) {
            throw new Error('No Pokemon data received');
        }
        pokemonList.forEach(pokemon => {
            if (pokemon) {
                const card = createPokemonCard(pokemon);
                pokemonGrid.appendChild(card);
            }
        });
        pokemonGrid.classList.add('show');
    } catch (error) {
        console.error('Error displaying Pokemon:', error);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

searchInput.addEventListener('input', debounce((e) => {
    const searchTerm = e.target.value.toLowerCase();
    searchPokemon(searchTerm);
}, 300));

async function searchPokemon(searchTerm) {
    try {
        if (!searchTerm) return resetToHome();
        prepareForSearch();

        const exists = checkPokemonExists(searchTerm);

        if (!exists) {
            await fetchAndDisplayPokemon(searchTerm);
        } else {
            filterExistingPokemon(searchTerm);
        }
    } catch (error) {
        console.error('Error searching Pokemon:', error);
    }
}

function prepareForSearch() {
    loadMoreButton.textContent = 'Home';
    loadMoreButton.onclick = resetToHome;
}

function checkPokemonExists(searchTerm) {
    return pokemonDataMap.has(Number(searchTerm)) ||
        Array.from(pokemonDataMap.values()).some(p => p.name.includes(searchTerm));
}

async function fetchAndDisplayPokemon(searchTerm) {
    const pokemon = await fetchPokemonData(searchTerm.toLowerCase());
    if (pokemon) displaySinglePokemon(pokemon);
}

function displaySinglePokemon(pokemon) {
    pokemonGrid.innerHTML = '';
    pokemonGrid.appendChild(createPokemonCard(pokemon));
}

function filterExistingPokemon(searchTerm) {
    const pokemonCards = pokemonGrid.getElementsByClassName('col');
    Array.from(pokemonCards).forEach(card => {
        const name = card.querySelector('.pokemon-name').textContent.toLowerCase();
        const number = card.querySelector('.pokemon-number').textContent.toLowerCase();
        card.style.display = (name.includes(searchTerm) || number.includes(searchTerm)) ? 'block' : 'none';
    });
}

function resetToHome() {
    searchInput.value = '';
    pokemonGrid.innerHTML = '';
    offset = 0;
    loadMoreButton.textContent = 'Load More';
    loadMoreButton.onclick = window.loadMorePokemon;
    displayPokemon(0, limit);
}
