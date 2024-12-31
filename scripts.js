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

async function fetchPokemon(offset, limit) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';

    try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const pokemonList = await fetchPokemonList(offset, limit);
        return await Promise.all(pokemonList.map(fetchDetailedPokemon));
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
    } finally {
        loadingScreen.style.display = 'none';
    }
}

function createCardElement() {
    const card = document.createElement('div');
    card.classList.add('col');
    return card;
}

function createCardInner(typeColors) {
    const cardInner = document.createElement('div');
    cardInner.classList.add('pokemon-card', 'd-flex', 'flex-column', 'align-items-center', 'p-3');
    setCardBackground(cardInner, typeColors);
    return cardInner;
}

function setCardBackground(cardInner, typeColors) {
    if (typeColors.length > 1) {
        cardInner.style.background = `linear-gradient(135deg, ${typeColors.join(', ')})`;
    } else {
        cardInner.style.background = `linear-gradient(135deg, ${typeColors[0]}, rgba(255, 255, 255, 0.1))`;
    }
    setCardBorderAndStyle(cardInner, typeColors);
}

function setCardBorderAndStyle(cardInner, typeColors) {
    cardInner.style.border = '3px solid transparent';
    cardInner.style.backgroundClip = 'padding-box';
    cardInner.style.position = 'relative';
    cardInner.style.borderRadius = '10px';
    cardInner.style.setProperty('--border-gradient',
        `linear-gradient(135deg, black, ${typeColors.join(', ')})`);
}

function createPokemonImage(pokemon) {
    const image = document.createElement('img');
    image.src = pokemon.sprites.front_default;
    image.alt = pokemon.name;
    image.classList.add('pokemon-image');
    return image;
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

function createPokemonCard(pokemon) {
    const typeColors = pokemon.types.map(type => `var(--${type.type.name}-light)`);
    const card = createCardElement();
    const cardInner = createCardInner(typeColors);
    cardInner.appendChild(createPokemonImage(pokemon));
    cardInner.appendChild(createPokemonInfo(pokemon));
    card.appendChild(cardInner);
    cardInner.addEventListener('click', () => displayPokemonDetails(pokemon));
    return card;
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

function getSpeciesId(evolution) {
    const speciesUrlParts = evolution.species.url.split('/');
    return speciesUrlParts[speciesUrlParts.length - 2];
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

function createTypesHTML(pokemon) {
    return pokemon.types.map(type => {
        const typeName = type.type.name;
        return `<span class="type-label type-${typeName} badge me-1">
            ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}</span>`;
    }).join(' ');
}

function updateDetailsHTML(pokemon, typesHTML, detailsContainer) {
    detailsContainer.innerHTML = generateDetailsHTML(pokemon, typesHTML);
    setupTabEventListeners();
}

function generateDetailsHTML(pokemon, typesHTML) {
    return `
        <div class="close-button-container">
            <button class="close-button" id="close-button">
                <img src="img/x.png" alt="Close" class="close-icon">
            </button>
        </div>
        ${createPokemonHeaderHTML(pokemon, typesHTML)}
        ${createPokemonContentHTML(pokemon)}
        ${createNavigationHTML()}
    `;
}

function createPokemonHeaderHTML(pokemon, typesHTML) {
    return `
        <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} 
            <span class="pokemon-number">N°${pokemon.id}</span>
        </h2>
        <p class="pokemon-types">${typesHTML}</p>
        <div class="pokemon-image-container">
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="detail-image">
        </div>
    `;
}

function createPokemonContentHTML(pokemon) {
    return `
        <div class="details-container-background">
            <div class="tabs">
                <button class="tab-button active" data-tab="stats">Base Stats</button>
                <button class="tab-button" data-tab="evolution">Evolution</button>
                <button class="tab-button" data-tab="abilities">Abilities</button>
                <button class="tab-button" data-tab="about">About</button>
            </div>
            ${createTabContentHTML(pokemon)}
        </div>
    `;
}

function createTabContentHTML(pokemon) {
    return `
        <div class="tab-content" id="tab-content">
            <div class="tab-pane active" id="stats">
                <div class="stats-container">
                    ${createStatsHTML(pokemon.stats)}
                </div>
            </div>
            <div class="tab-pane" id="evolution">
                <div class="evolution-container" id="evolution-container"></div>
            </div>
            <div class="tab-pane" id="abilities">
                <p>${pokemon.abilities.map(ability => ability.ability.name).join(', ')}</p>
            </div>
            <div class="tab-pane" id="about">
                <p>Height: ${pokemon.height * 10} cm</p>
                <p>Weight: ${pokemon.weight / 10} kg</p>
            </div>
        </div>
    `;
}

function createNavigationHTML() {
    return `
        <div class="navigation">
            <button class="nav-button" id="prev-button">
                <img src="img/prev.png" alt="Previous Pokemon" class="nav-icon">
            </button>
            <button class="nav-button" id="next-button">
                <img src="img/next.png" alt="Next Pokemon" class="nav-icon">
            </button>
        </div>
    `;
}

function createStatsHTML(stats) {
    return stats.map(stat => {
        const { statValue, percentage, statColor, shortName, fullName } = getStatInfo(stat);
        return `
            <div class="stat-bar">
                <div class="stat-label">
                    <span class="stat-name-full">${fullName}</span>
                    <span class="stat-name-short">${shortName}</span>
                    : ${statValue}
                </div>
                <div class="bar" style="--final-width: ${percentage}%; --stat-color: ${statColor};"></div>
            </div>
        `;
    }).join('');
}

function getStatInfo(stat) {
    const statValue = stat.base_stat;
    const maxStatValue = 410;
    const percentage = (statValue / maxStatValue) * 100;
    const statColor = getStatColor(statValue);
    const fullName = stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1);
    const shortName = getShortStatName(stat.stat.name);
    return { statValue, percentage, statColor, shortName, fullName };
}

function getStatColor(value) {
    if (value <= 30) return 'rgb(207, 2, 2)';
    if (value <= 50) return 'rgb(207, 193, 2)';
    return 'rgb(10, 141, 69)';
}

function getShortStatName(statName) {
    const shortNames = {
        'hp': 'HP',
        'attack': 'ATK',
        'defense': 'DEF',
        'special-attack': 'SP.ATK',
        'special-defense': 'SP.DEF',
        'speed': 'SPD'
    };
    return shortNames[statName] || statName;
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
    const pokemonCards = pokemonGrid.getElementsByClassName('col');
    Array.from(pokemonCards).forEach(card => {
        const name = card.querySelector('.pokemon-name').textContent.toLowerCase();
        const number = card.querySelector('.pokemon-number').textContent.toLowerCase();
        card.style.display = (name.includes(searchTerm) || number.includes(searchTerm)) ? 'block' : 'none';
    });
}, 300));
