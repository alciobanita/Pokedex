const pokemonGrid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('search');
const loadMoreButton = document.getElementById('load-more');
const loadingScreen = document.getElementById('loading-screen');

let offset = 0;
const limit = 30;
const pokemonDataMap = new Map();

async function fetchPokemonList(offset, limit) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    return data.results;
}

async function fetchDetailedPokemon(pokemon) {
    const pokemonResponse = await fetch(pokemon.url);
    const pokemonData = await pokemonResponse.json();
    pokemonDataMap.set(pokemonData.id, pokemonData);
    return pokemonData;
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

    const number = document.createElement('p');
    number.textContent = `N°${pokemon.id}`;
    number.classList.add('pokemon-number');

    const name = document.createElement('h5');
    name.textContent = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
    name.classList.add('pokemon-name');

    info.appendChild(number);
    info.appendChild(name);
    info.appendChild(createTypes(pokemon.types));
    return info;
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

        console.log('Evolution Data:', evolutionData);

        return { evolutionData, speciesData };
    } catch (error) {
        console.error('Error fetching evolution chain:', error);
        return null;
    }
}

function createEvolutionElement(evolution) {
    const evolutionDiv = document.createElement('div');
    evolutionDiv.classList.add('evolution');

    const speciesName = evolution.species.name;
    const speciesUrlParts = evolution.species.url.split('/');
    const speciesId = speciesUrlParts[speciesUrlParts.length - 2];

    const image = document.createElement('img');
    const pokemon = pokemonDataMap.get(parseInt(speciesId));

    if (pokemon) {
        image.src = pokemon.sprites.front_default;
    } else {
        image.src = '/placeholder.svg?height=100&width=100';
    }

    image.alt = speciesName;
    image.classList.add('evolution-image');

    const level = document.createElement('span');
    if (evolution.evolution_details && evolution.evolution_details.length > 0) {
        const minLevel = evolution.evolution_details[0].min_level;
        level.textContent = minLevel ? `Lv. ${minLevel}` : '';
    } else {
        level.textContent = '';
    }

    const levelContainer = document.createElement('div');
    levelContainer.classList.add('level-container');

    const nameElement = document.createElement('div');
    nameElement.textContent = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);
    nameElement.classList.add('evolution-name');

    levelContainer.appendChild(image);
    levelContainer.appendChild(nameElement);
    levelContainer.appendChild(level);

    evolutionDiv.appendChild(levelContainer);

    evolutionDiv.addEventListener('click', () => {
        const pokemonToDisplay = pokemonDataMap.get(parseInt(speciesId));
        if (pokemonToDisplay) {
            displayPokemonDetails(pokemonToDisplay);
        }
    });

    return evolutionDiv;
}

async function displayPokemonDetails(pokemon) {
    const detailsContainer = document.getElementById('pokemon-details');
    const overlay = document.getElementById('overlay');

    setupDetailsContainer(pokemon, detailsContainer, overlay);

    const evolutionDataResponse = await fetchEvolutionChain(pokemon.id);
    const evolutionData = evolutionDataResponse.evolutionData;
    const speciesData = evolutionDataResponse.speciesData;

    const { typesHTML, flavorText } = createBasicInfo(pokemon, speciesData);

    detailsContainer.innerHTML = `
    <div class="close-button-container">
        <button class="close-button" id="close-button">
            <img src="img/x.png" alt="Close" class="close-icon">
        </button>
    </div>
    <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} <span class="pokemon-number">N°${pokemon.id}</span></h2>
    <p class="pokemon-types">${typesHTML}</p>
     <div class="pokemon-image-container">
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="detail-image">
    </div>
    <div class="details-container-background">
    <div class="tabs">
        <button class="tab-button active" data-tab="stats">Base Stats</button>
        <button class="tab-button" data-tab="evolution">Evolution</button>
        <button class="tab-button" data-tab="abilities">Abilities</button>
        <button class="tab-button" data-tab="about">About</button>
    </div>
    <div class="tab-content" id="tab-content">
        <div class="tab-pane active" id="stats">
            <div class="stats-container">
                ${pokemon.stats.map(stat => {
        const statValue = stat.base_stat;
        const maxStatValue = 255;
        const percentage = (statValue / maxStatValue) * 100;

        const shortNames = {
            'hp': 'HP',
            'attack': 'ATK',
            'defense': 'DEF',
            'special-attack': 'SP.ATK',
            'special-defense': 'SP.DEF',
            'speed': 'SPD'
        };

        let statColor;
        if (statValue <= 30) {
            statColor = 'rgb(207, 2, 2)';
        } else if (statValue <= 50) {
            statColor = 'rgb(207, 193, 2)';
        } else {
            statColor = 'rgb(10, 141, 69)';
        }

        const fullName = stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1);
        const shortName = shortNames[stat.stat.name] || fullName;

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
    }).join('')}
            </div>
        </div>
        <div class="tab-pane" id="evolution">
            <div class="evolution-container" id="evolution-container"></div>
        </div>
        <div class="tab-pane" id="abilities">
            <p>${pokemon.abilities.map(ability => ability.ability.name).join(', ')}</p>
        </div>
        <div class="tab-pane" id="about">
            <p>Species: ${speciesData.name.charAt(0).toUpperCase() + speciesData.name.slice(1)}</p>
            <p>Height: ${pokemon.height * 10} cm</p>
            <p>Weight: ${pokemon.weight / 10} kg</p>
        </div>
    </div>
    </div>
    <div class="navigation">
        <button class="nav-button" id="prev-button">
            <img src="img/prev.png" alt="Previous Pokemon" class="nav-icon">
        </button>
        <button class="nav-button" id="next-button">
            <img src="img/next.png" alt="Next Pokemon" class="nav-icon">
        </button>
    </div>
`;

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

    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const closeButton = document.getElementById('close-button');

    const currentId = pokemon.id;

    prevButton.disabled = currentId === 1;
    nextButton.disabled = currentId === 898;

    prevButton.addEventListener('click', async () => {
        if (currentId > 1) {
            const prevId = currentId - 1;
            let prevPokemon;

            try {
                loadingScreen.style.display = 'flex';
                prevPokemon = await fetchPokemonData(prevId);
                if (prevPokemon) {
                    await displayPokemonDetails(prevPokemon);
                }
            } catch (error) {
                console.error('Error fetching previous Pokemon:', error);
            } finally {
                loadingScreen.style.display = 'none';
            }
        }
    });

    nextButton.addEventListener('click', async () => {
        if (currentId < 898) {
            const nextId = currentId + 1;
            let nextPokemon;

            try {
                loadingScreen.style.display = 'flex';
                nextPokemon = await fetchPokemonData(nextId);
                if (nextPokemon) {
                    await displayPokemonDetails(nextPokemon);
                }
            } catch (error) {
                console.error('Error fetching next Pokemon:', error);
            } finally {
                loadingScreen.style.display = 'none';
            }
        }
    });

    closeButton.addEventListener('click', () => {
        detailsContainer.style.display = 'none';
        overlay.style.display = 'none';
    });

    if (evolutionData) {
        const evolutionContainer = document.getElementById('evolution-container');
        evolutionContainer.innerHTML = '';

        const allEvolutions = [];
        function collectEvolutions(chain) {
            if (chain) {
                allEvolutions.push(chain);
                chain.evolves_to.forEach(evo => collectEvolutions(evo));
            }
        }

        collectEvolutions(evolutionData.chain);

        const evolutionPromises = allEvolutions.map(async (evolution) => {
            const speciesUrlParts = evolution.species.url.split('/');
            const speciesId = speciesUrlParts[speciesUrlParts.length - 2];
            const pokemonData = await fetchPokemonData(speciesId);
            return pokemonData;
        });

        const evolutionDataList = await Promise.all(evolutionPromises);
        evolutionDataList.forEach(pokemon => {
            if (pokemon) {
                const evolutionElement = createEvolutionElement(pokemon);
                evolutionContainer.appendChild(evolutionElement);
            }
        });
    }
}

function setupDetailsContainer(pokemon, detailsContainer, overlay) {
    detailsContainer.style.display = 'block';
    overlay.style.display = 'block';
    setDetailsBackground(detailsContainer, pokemon);
}

function setDetailsBackground(detailsContainer, pokemon) {
    const typeColors = pokemon.types.map(type => `var(--${type.type.name}-light)`);
    detailsContainer.style.background = typeColors.length > 1
        ? `linear-gradient(135deg, ${typeColors.join(', ')}, black)`
        : `linear-gradient(135deg, ${typeColors[0]}, black)`;
}

function createBasicInfo(pokemon, speciesData) {
    const typesHTML = createTypesHTML(pokemon);
    const flavorTextEntry = speciesData.flavor_text_entries.find(entry =>
        entry.language.name === 'en');
    const flavorText = flavorTextEntry ? flavorTextEntry.flavor_text
        : 'No description available.';

    return { typesHTML, flavorText };
}

function createTypesHTML(pokemon) {
    return pokemon.types.map(type => {
        const typeName = type.type.name;
        return `<span class="type-label type-${typeName} badge me-1">
            ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}</span>`;
    }).join(' ');
}

async function fetchPokemonData(pokemonId) {
    const loadingScreen = document.getElementById('loading-screen');

    try {
        loadingScreen.style.display = 'flex';
        if (pokemonDataMap.has(parseInt(pokemonId))) {
            return pokemonDataMap.get(parseInt(pokemonId));
        } else {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/`);
            const pokemonData = await response.json();
            pokemonDataMap.set(pokemonData.id, pokemonData);
            return pokemonData;
        }
    } catch (error) {
        console.error('Error fetching Pokemon:', error);
        return null;
    } finally {
        loadingScreen.style.display = 'none';
    }
}

async function displayPokemon(offset, limit) {
    const pokemonList = await fetchPokemon(offset, limit);
    pokemonList.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        pokemonGrid.appendChild(card);
    });

    pokemonGrid.classList.add('show');
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

loadMoreButton.addEventListener('click', () => {
    offset += limit;
    displayPokemon(offset, limit);
});

displayPokemon(offset, limit);