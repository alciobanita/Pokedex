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