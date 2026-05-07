// Card types: 'attack' (A), 'midfield' (M), 'defense' (D), 'goalkeeper' (B)
// Ability types: 'active_coin', 'active', 'passive'

export const CARD_DEFINITIONS = [
  {
    id: 'hugo',
    name: 'HUGO',
    type: 'attack',
    typeLabel: 'A',
    attackStat: 5,
    defenseStat: 0,
    rarity: 'common',
    marketPrice: 120,
    sellPrice: 50,
    upgradeCost: [60, 120, 250],
    upgradeStatBonus: 1,
    color: '#e8f5e9',
    abilityName: 'RZUT KARNY',
    abilityType: 'active_coin',
    abilityDescription: 'Rzuć żetonem. Piłka wyrzuca obrońcę przeciwnika. Rękawica odejmuje 2 ataku Hugo.',
    noActivationDescription: 'Dodaje Hugo 5 ataku do końca meczu.',
    activationEffect: {
      ball: { type: 'remove_opponent_card', targetSector: 'defense', message: 'Piłka! Obrońca przeciwnika zostaje wyrzucony!' },
      glove: { type: 'self_stat_change', stat: 'attackStat', amount: -2, message: 'Rękawica! Hugo traci 2 pkt ataku.' },
    },
    noActivationEffect: { type: 'self_stat_change', stat: 'attackStat', amount: 5, permanent: true, message: 'Hugo zyskuje +5 ataku do końca meczu!' },
    count: 3,
  },
  {
    id: 'harry',
    name: 'HARRY',
    type: 'defense',
    typeLabel: 'D',
    attackStat: 2,
    defenseStat: 7,
    rarity: 'common',
    marketPrice: 110,
    sellPrice: 45,
    upgradeCost: [55, 110, 220],
    upgradeStatBonus: 1,
    color: '#e8eaf6',
    abilityName: 'WŚLIZG',
    abilityType: 'active_coin',
    abilityDescription: 'Rzuć żetonem. Piłka wyrzuca ofensywnego gracza przeciwnika. Rękawica wyrzuca Harry\'ego z meczu.',
    noActivationDescription: 'Co rundę Twój bramkarz traci 1 pkt obrony.',
    activationEffect: {
      ball: { type: 'remove_opponent_card', targetSector: 'offense', message: 'Wślizg! Ofensywa przeciwnika traci gracza!' },
      glove: { type: 'remove_self', message: 'Rękawica! Harry zostaje wyrzucony z meczu.' },
    },
    noActivationEffect: { type: 'opponent_goalkeeper_stat_change', stat: 'defenseStat', amount: -1, perRound: true, message: 'Bramkarz traci 1 pkt obrony!' },
    count: 3,
  },
  {
    id: 'rushy',
    name: 'RUSHY',
    type: 'attack',
    typeLabel: 'A',
    attackStat: 7,
    defenseStat: 1,
    rarity: 'rare',
    marketPrice: 280,
    sellPrice: 110,
    upgradeCost: [140, 280, 560],
    upgradeStatBonus: 2,
    color: '#fff3e0',
    abilityName: 'SPRINT',
    abilityType: 'active_coin',
    abilityDescription: 'Rzuć żetonem. Piłka: +3 ataku na tę rundę. Rękawica: przeciwnik dobiera kartę.',
    noActivationDescription: 'Rushy traci 1 atak każdą rundę.',
    activationEffect: {
      ball: { type: 'self_stat_change', stat: 'attackStat', amount: 3, message: 'Sprint! Rushy zyskuje +3 ataku!' },
      glove: { type: 'opponent_draw_card', message: 'Rękawica! Przeciwnik dobiera kartę.' },
    },
    noActivationEffect: { type: 'self_stat_change', stat: 'attackStat', amount: -1, perRound: true, message: 'Rushy traci 1 atak.' },
    count: 2,
  },
  {
    id: 'wilko',
    name: 'WILKO',
    type: 'defense',
    typeLabel: 'D',
    attackStat: 1,
    defenseStat: 6,
    rarity: 'common',
    marketPrice: 100,
    sellPrice: 40,
    upgradeCost: [50, 100, 200],
    upgradeStatBonus: 1,
    color: '#e8f5e9',
    abilityName: 'BLOK',
    abilityType: 'active',
    abilityDescription: 'Zmniejsza atak wybranego ofensywnego gracza przeciwnika o 2 na tę rundę.',
    noActivationDescription: 'Przeciwnik zyskuje +1 atak na tę rundę.',
    activationEffect: {
      direct: { type: 'reduce_opponent_attack', amount: 2, message: 'Blok! Atak przeciwnika zredukowany o 2!' },
    },
    noActivationEffect: { type: 'opponent_stat_change', stat: 'attackStat', amount: 1, message: 'Brak bloku! Przeciwnik zyskuje +1 atak.' },
    count: 2,
  },
  {
    id: 'freddie',
    name: 'FREDDIE',
    type: 'midfield',
    typeLabel: 'M',
    attackStat: 4,
    defenseStat: 4,
    rarity: 'rare',
    marketPrice: 200,
    sellPrice: 80,
    upgradeCost: [100, 200, 400],
    upgradeStatBonus: 1,
    color: '#f3e5f5',
    abilityName: 'PODANIE',
    abilityType: 'active',
    abilityDescription: 'Przesuwa jednego piłkarza z sektora ofensywnego do defensywnego lub odwrotnie.',
    noActivationDescription: 'Freddie nie może być aktywowany w kolejnej rundzie.',
    activationEffect: {
      direct: { type: 'swap_sector', message: 'Podanie! Piłkarz zmienia sektor!' },
    },
    noActivationEffect: { type: 'self_lock', rounds: 1, message: 'Freddie jest zmęczony – blokada na 1 rundę.' },
    count: 2,
  },
  {
    id: 'marco',
    name: 'MARCO',
    type: 'midfield',
    typeLabel: 'M',
    attackStat: 3,
    defenseStat: 5,
    rarity: 'common',
    marketPrice: 130,
    sellPrice: 52,
    upgradeCost: [65, 130, 260],
    upgradeStatBonus: 1,
    color: '#e0f7fa',
    abilityName: 'ZASŁONA',
    abilityType: 'passive',
    abilityDescription: 'Pasywna: Wszyscy sojusznicy w tym samym sektorze zyskują +1 obrony.',
    noActivationDescription: '',
    passiveEffect: { type: 'sector_buff', stat: 'defenseStat', amount: 1, message: 'Marco zasłania – sojusznicy +1 obronę!' },
    count: 2,
  },
  {
    id: 'aaron',
    name: 'AARON',
    type: 'goalkeeper',
    typeLabel: 'B',
    attackStat: 0,
    defenseStat: 25,
    rarity: 'rare',
    marketPrice: 350,
    sellPrice: 140,
    upgradeCost: [175, 350, 700],
    upgradeStatBonus: 3,
    color: '#cfd8dc',
    abilityName: 'ŚCIANA',
    abilityType: 'passive',
    abilityDescription: 'Pasywna: Obrońca dostaje +1 obrony gdy atakujący go zawodnik użyje umiejętności aktywowanej.',
    noActivationDescription: '',
    passiveEffect: { type: 'defender_buff_on_opponent_activation', stat: 'defenseStat', amount: 1, message: 'Ściana! Obrońca zyskuje +1 obronę!' },
    count: 2,
  },
  {
    id: 'titan',
    name: 'TITAN',
    type: 'goalkeeper',
    typeLabel: 'B',
    attackStat: 0,
    defenseStat: 20,
    rarity: 'common',
    marketPrice: 220,
    sellPrice: 88,
    upgradeCost: [110, 220, 440],
    upgradeStatBonus: 2,
    color: '#cfd8dc',
    abilityName: 'PIĘŚĆ',
    abilityType: 'active_coin',
    abilityDescription: 'Rzuć żetonem. Piłka: blokuje następny atak. Rękawica: Titan traci 5 obrony.',
    noActivationDescription: 'Titan zyskuje +3 obrony na tę rundę.',
    activationEffect: {
      ball: { type: 'block_next_attack', message: 'Pięść! Następny atak zablokowany!' },
      glove: { type: 'self_stat_change', stat: 'defenseStat', amount: -5, message: 'Rękawica! Titan traci 5 obrony.' },
    },
    noActivationEffect: { type: 'self_stat_change', stat: 'defenseStat', amount: 3, message: 'Titan skupia się – +3 obrony!' },
    count: 2,
  },
]

export const SPECIAL_CARDS = [
  {
    id: 'referee',
    name: 'SĘDZIA',
    description: 'Żółta kartka! Jeden losowy zawodnik każdej drużyny nie może być aktywowany przez 1 rundę.',
    effect: { type: 'lock_random_card', rounds: 1 },
  },
  {
    id: 'fans',
    name: 'KIBICE',
    description: 'Doping tłumów! Drużyna z mniejszą liczbą zawodników zyskuje +5 ataku lub obrony.',
    effect: { type: 'underdog_buff', amount: 5 },
  },
  {
    id: 'pitch',
    name: 'CIĘŻKIE BOISKO',
    description: 'Błotniste boisko! Wszystkie karty ataku tracą 1 punkt ataku na tę rundę.',
    effect: { type: 'global_attack_debuff', amount: -1 },
  },
  {
    id: 'var',
    name: 'VAR',
    description: 'Weryfikacja! Każdy gracz może cofnąć jedną akcję z ostatniej rundy.',
    effect: { type: 'undo_last_action' },
  },
]

export function getCardDefinition(id) {
  return CARD_DEFINITIONS.find(c => c.id === id) || null
}

export function createDeckFromOwned(ownedCards, allDefs) {
  const deck = []
  const findDef = (id) => allDefs
    ? allDefs.find(d => d.id === id)
    : getCardDefinition(id)
  for (const owned of ownedCards) {
    const def = findDef(owned.cardId)
    if (!def) continue
    const bonus = (owned.upgradeLevel || 0) * (def.upgradeStatBonus || 1)
    const isPrimarilyAttack = def.type === 'attack' || (def.type === 'midfield' && def.attackStat >= def.defenseStat)
    deck.push({
      ...def,
      instanceId: owned.instanceId,
      currentAttackStat: def.attackStat + (isPrimarilyAttack ? bonus : 0),
      currentDefenseStat: def.defenseStat + (!isPrimarilyAttack || def.type === 'goalkeeper' || def.type === 'defense' ? bonus : 0),
      isLocked: false,
      lockedRounds: 0,
      justPlaced: false,
      faceDown: false,
      upgradeLevel: owned.upgradeLevel || 0,
    })
  }
  return shuffleDeck(deck)
}

export function createDefaultDeck(playerId) {
  const deck = []
  for (const def of CARD_DEFINITIONS) {
    for (let i = 0; i < def.count; i++) {
      deck.push({
        ...def,
        instanceId: `${playerId}_${def.id}_${i}`,
        currentAttackStat: def.attackStat,
        currentDefenseStat: def.defenseStat,
        isLocked: false,
        lockedRounds: 0,
        justPlaced: false,
        faceDown: false,
        upgradeLevel: 0,
      })
    }
  }
  return shuffleDeck(deck)
}

export function shuffleDeck(deck) {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function separateDeck(deck) {
  const goalkeepers = deck.filter(c => c.type === 'goalkeeper')
  const players = deck.filter(c => c.type !== 'goalkeeper')
  return { goalkeepers: shuffleDeck(goalkeepers), players: shuffleDeck(players) }
}
