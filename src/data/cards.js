// Card types: 'attack' (A), 'midfield' (M), 'defense' (D), 'goalkeeper' (B)
// Ability types: 'active_coin', 'active', 'passive', 'passive_no_activation'

export const CARD_DEFINITIONS = [
  {
    id: 'hugo',
    name: 'HUGO',
    type: 'attack',
    typeLabel: 'A',
    attackStat: 5,
    defenseStat: 0,
    color: '#e8f5e9',
    abilityName: 'RZUT KARNY',
    abilityType: 'active_coin',
    abilityDescription: 'Rzuć żetonem. Piłka wyrzuca obrońcę Hugo. Rękawica odejmuje 2 punkty ataku Hugo.',
    noActivationDescription: 'Dodaje Hugo 5 ataku do końca meczu.',
    activationEffect: {
      ball: { type: 'remove_opponent_card', targetSector: 'defense', message: 'Piłka! Obrońca przeciwnika zostaje wyrzucony z gry!' },
      glove: { type: 'self_stat_change', stat: 'attackStat', amount: -2, message: 'Rękawica! Hugo traci 2 punkty ataku.' },
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
    color: '#e8eaf6',
    abilityName: 'WŚLIZG',
    abilityType: 'active_coin',
    abilityDescription: 'Rzuć żetonem. Piłka wyrzuca wybranego ofensywnego gracza przeciwnika. Rękawica wyrzuca Harry\'ego z meczu.',
    noActivationDescription: 'Co rundę Twój bramkarz traci 1 pkt obrony.',
    activationEffect: {
      ball: { type: 'remove_opponent_card', targetSector: 'offense', message: 'Wślizg! Ofensywny gracz przeciwnika zostaje wyrzucony!' },
      glove: { type: 'remove_self', message: 'Rękawica! Harry zostaje wyrzucony z meczu.' },
    },
    noActivationEffect: { type: 'opponent_goalkeeper_stat_change', stat: 'defenseStat', amount: -1, perRound: true, message: 'Twój bramkarz traci 1 pkt obrony!' },
    count: 3,
  },
  {
    id: 'rushy',
    name: 'RUSHY',
    type: 'attack',
    typeLabel: 'A',
    attackStat: 7,
    defenseStat: 1,
    color: '#fff3e0',
    abilityName: 'SPRINT',
    abilityType: 'active_coin',
    abilityDescription: 'Rzuć żetonem. Piłka dodaje 3 ataku Rushy na tę rundę. Rękawica – przeciwnik dobiera kartę.',
    noActivationDescription: 'Rushy traci 1 atak każdą rundę (nie dotknięty piłką).',
    activationEffect: {
      ball: { type: 'self_stat_change', stat: 'attackStat', amount: 3, message: 'Sprint! Rushy zyskuje +3 ataku na tę rundę!' },
      glove: { type: 'opponent_draw_card', message: 'Rękawica! Przeciwnik dobiera dodatkową kartę.' },
    },
    noActivationEffect: { type: 'self_stat_change', stat: 'attackStat', amount: -1, perRound: true, message: 'Rushy traci 1 atak – nie aktywowany.' },
    count: 2,
  },
  {
    id: 'wilko',
    name: 'WILKO',
    type: 'defense',
    typeLabel: 'D',
    attackStat: 1,
    defenseStat: 6,
    color: '#e8f5e9',
    abilityName: 'BLOK',
    abilityType: 'active',
    abilityDescription: 'Aktywacja: Wybierz jeden atak przeciwnika w sektorze ofensywnym i zredukuj jego atak o 2 na tę rundę.',
    noActivationDescription: 'Brak aktywacji: Przeciwnik zyskuje +1 atak na tę rundę.',
    activationEffect: {
      direct: { type: 'reduce_opponent_attack', amount: 2, message: 'Blok! Wybrany atak przeciwnika zmniejsza się o 2!' },
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
    color: '#f3e5f5',
    abilityName: 'PODANIE',
    abilityType: 'active',
    abilityDescription: 'Aktywacja: Przesuń jednego swojego piłkarza z sektora ofensywnego do defensywnego lub odwrotnie.',
    noActivationDescription: 'Brak aktywacji: Freddie nie może być aktywowany w kolejnej rundzie.',
    activationEffect: {
      direct: { type: 'swap_sector', message: 'Podanie! Piłkarz zostaje przesunięty do innego sektora!' },
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
    color: '#e0f7fa',
    abilityName: 'ZASŁONA',
    abilityType: 'passive',
    abilityDescription: 'Pasywna: Twoi piłkarze w tym samym sektorze zyskują +1 do obrony.',
    noActivationDescription: '',
    passiveEffect: { type: 'sector_buff', stat: 'defenseStat', amount: 1, message: 'Marco zasłania – sojusznicy zyskują +1 obronę!' },
    count: 2,
  },
  {
    id: 'aaron',
    name: 'AARON',
    type: 'goalkeeper',
    typeLabel: 'B',
    attackStat: 0,
    defenseStat: 25,
    color: '#cfd8dc',
    abilityName: 'ŚCIANA',
    abilityType: 'passive',
    abilityDescription: 'Pasywna: Twój obrońca dostaje +1 do obrony jeśli atakujący go zawodnik użyje umiejętności aktywowanej.',
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
    color: '#cfd8dc',
    abilityName: 'PIĘŚĆ',
    abilityType: 'active_coin',
    abilityDescription: 'Rzuć żetonem. Piłka: zablokuj następny atak przeciwnika. Rękawica: Titan traci 5 obrony.',
    noActivationDescription: 'Brak aktywacji: Titan zyskuje +3 obrony na tę rundę.',
    activationEffect: {
      ball: { type: 'block_next_attack', message: 'Pięść! Następny atak przeciwnika zostaje zablokowany!' },
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
    description: 'Żółta kartka! Jeden losowy zawodnik każdego gracza nie może być aktywowany przez 1 rundę.',
    effect: { type: 'lock_random_card', rounds: 1 },
  },
  {
    id: 'fans',
    name: 'KIBICE',
    description: 'Doping tłumów! Gracz z mniejszą liczbą zawodników na boisku zyskuje +5 ataku lub obrony.',
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

export function createDeck(playerId) {
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
