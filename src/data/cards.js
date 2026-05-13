import CARD_DEFINITIONS_RAW from './cards.json'
import SPECIAL_CARDS_RAW from './special-cards.json'

export const CARD_DEFINITIONS = CARD_DEFINITIONS_RAW
export const SPECIAL_CARDS = SPECIAL_CARDS_RAW

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
    const level = owned.upgradeLevel || 0
    const bonus = level * (def.upgradeStatBonus || 1)
    const maxBonus = level >= 3 ? (def.maxLevelBonus ?? (def.rarity === 'legendary' ? 5 : 3)) : 0
    const isPrimarilyAttack = def.type === 'attack' || (def.type === 'midfield' && def.attackStat >= def.defenseStat)
    const isDefOrGK = !isPrimarilyAttack || def.type === 'goalkeeper' || def.type === 'defense'
    deck.push({
      ...def,
      instanceId: owned.instanceId,
      currentAttackStat: def.attackStat + (isPrimarilyAttack ? bonus + maxBonus : 0),
      currentDefenseStat: def.defenseStat + (isDefOrGK ? bonus + maxBonus : 0),
      isLocked: false,
      lockedRounds: 0,
      justPlaced: false,
      faceDown: false,
      upgradeLevel: level,
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

export function createBalancedAIDeck(playerDeck) {
  if (!playerDeck?.length) return createDefaultDeck('B')

  const avgPower = playerDeck.reduce((sum, c) =>
    sum + (c.currentAttackStat ?? c.attackStat ?? 0) + (c.currentDefenseStat ?? c.defenseStat ?? 0), 0
  ) / playerDeck.length

  const pool = CARD_DEFINITIONS.filter(d => d.marketPrice > 0)

  const scored = pool.map(d => ({
    def: d,
    diff: Math.abs(((d.attackStat || 0) + (d.defenseStat || 0)) - avgPower),
  })).sort((a, b) => a.diff - b.diff)

  const byType = (type) => scored.filter(s => s.def.type === type)

  const pick = (type, n) => {
    const candidates = byType(type)
    const topN = candidates.slice(0, Math.max(n * 3, 8))
    for (let i = topN.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topN[i], topN[j]] = [topN[j], topN[i]]
    }
    return topN.slice(0, n).map(s => s.def)
  }

  const gks  = pick('goalkeeper', 2)
  const defs = pick('defense', 4)
  const mids = pick('midfield', 3)
  const atks = pick('attack', 2)

  let selected = [...gks, ...defs, ...mids, ...atks].filter(Boolean)

  if (selected.length < 11) {
    const usedIds = new Set(selected.map(d => d.id))
    const extras = scored.filter(s => !usedIds.has(s.def.id)).map(s => s.def)
    for (let i = extras.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [extras[i], extras[j]] = [extras[j], extras[i]]
    }
    selected = [...selected, ...extras].slice(0, 11)
  }

  return selected.slice(0, 11).map((def, i) => ({
    ...def,
    instanceId: `ai_${def.id}_${i}`,
    currentAttackStat: def.attackStat,
    currentDefenseStat: def.defenseStat,
    isLocked: false,
    lockedRounds: 0,
    justPlaced: false,
    faceDown: false,
    upgradeLevel: 0,
  }))
}

export function createWeakerAIDeck(playerDeck) {
  if (!playerDeck?.length) return createDefaultDeck('B')

  const avgPower = playerDeck.reduce((sum, c) =>
    sum + (c.currentAttackStat ?? c.attackStat ?? 0) + (c.currentDefenseStat ?? c.defenseStat ?? 0), 0
  ) / playerDeck.length

  const targetPower = avgPower * 0.55

  const pool = CARD_DEFINITIONS.filter(d => d.marketPrice > 0)
  const scored = pool.map(d => ({
    def: d,
    power: (d.attackStat || 0) + (d.defenseStat || 0),
    diff: Math.abs(((d.attackStat || 0) + (d.defenseStat || 0)) - targetPower),
  })).sort((a, b) => a.diff - b.diff)

  const byType = (type) => scored.filter(s => s.def.type === type)
  const pick = (type, n) => {
    const bucket = byType(type)
    const step = Math.max(1, Math.floor(bucket.length / n))
    return Array.from({ length: n }, (_, i) => bucket[Math.min(i * step, bucket.length - 1)]?.def).filter(Boolean)
  }

  let selected = [...pick('goalkeeper', 2), ...pick('defense', 4), ...pick('midfield', 3), ...pick('attack', 2)].filter(Boolean)
  if (selected.length < 11) {
    const usedIds = new Set(selected.map(d => d.id))
    selected = [...selected, ...scored.filter(s => !usedIds.has(s.def.id)).map(s => s.def)].slice(0, 11)
  }

  return selected.slice(0, 11).map((def, i) => ({
    ...def,
    instanceId: `ai_${def.id}_${i}`,
    currentAttackStat: def.attackStat,
    currentDefenseStat: def.defenseStat,
    isLocked: false, lockedRounds: 0, justPlaced: false, faceDown: false, upgradeLevel: 0,
  }))
}

export function createEliteAIDeck() {
  const pool = CARD_DEFINITIONS.filter(d => d.marketPrice > 0)
  const scored = pool.map(d => ({
    def: d,
    power: (d.attackStat || 0) + (d.defenseStat || 0),
  })).sort((a, b) => b.power - a.power)

  const byType = (type) => scored.filter(s => s.def.type === type)
  const pick = (type, n) => byType(type).slice(0, n).map(s => s.def)

  let selected = [...pick('goalkeeper', 2), ...pick('defense', 4), ...pick('midfield', 3), ...pick('attack', 2)].filter(Boolean)
  if (selected.length < 11) {
    const usedIds = new Set(selected.map(d => d.id))
    selected = [...selected, ...scored.filter(s => !usedIds.has(s.def.id)).map(s => s.def)].slice(0, 11)
  }

  return selected.slice(0, 11).map((def, i) => ({
    ...def,
    instanceId: `ai_${def.id}_${i}`,
    currentAttackStat: def.attackStat,
    currentDefenseStat: def.defenseStat,
    isLocked: false, lockedRounds: 0, justPlaced: false, faceDown: false, upgradeLevel: 0,
  }))
}
