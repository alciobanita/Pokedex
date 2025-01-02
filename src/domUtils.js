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
