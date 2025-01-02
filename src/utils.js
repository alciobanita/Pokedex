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

function getSpeciesId(evolution) {
    const speciesUrlParts = evolution.species.url.split('/');
    return speciesUrlParts[speciesUrlParts.length - 2];
}
