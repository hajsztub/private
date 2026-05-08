import { shuffleDeck, SPECIAL_CARDS, createDefaultDeck, createDeckFromOwned, separateDeck } from '../data/cards.js'
import { resolveRoundGoals, computeMatchStats } from './scoreEngine.js'

export const MAX_ROUNDS = 10
export const MAX_SECTOR_SIZE = 3
export const HAND_SIZE = 4

export function createMatchState(matchType = 'local', playerDeckCards = null, aiDeckCards = null) {
  const playerDeckRaw = playerDeckCards || createDefaultDeck('A')
  const aiDeckRaw = aiDeckCards || createDefaultDeck('B')

  const { goalkeepers: gkA, players: playersA } = separateDeck(playerDeckRaw)
  const { goalkeepers: gkB, players: playersB } = separateDeck(aiDeckRaw)

  return {
    phase: 'goalkeeper_selection',
    round: 0,
    currentPlayer: 'A',
    matchType,
    maxRounds: MAX_ROUNDS,
    endGameOnRound: null,
    skipTurn: null,
    turnActionsUsed: { placedOffense: false, placedDefense: false, activatedAbility: false },
    players: {
      A: {
        id: 'A',
        deck: playersA,
        hand: [],
        goalkeepers: gkA,
        activeGoalkeeper: null,
        reserveGoalkeeper: null,
        offenseSector: [],
        defenseSector: [],
      },
      B: {
        id: 'B',
        deck: playersB,
        hand: [],
        goalkeepers: gkB,
        activeGoalkeeper: null,
        reserveGoalkeeper: null,
        offenseSector: [],
        defenseSector: [],
      },
    },
    displayScore: { player: 0, ai: 0 },
    goalEvents: [],
    specialCard: null,
    specialCardRevealed: false,
    log: [],
    coinFlipState: null,
    redraws: 0,
    winner: null,
  }
}

export function addLog(state, message, type = 'info') {
  return {
    ...state,
    log: [{ message, type, round: state.round }, ...state.log].slice(0, 60),
  }
}

// ── Goalkeeper selection ───────────────────────────────────────────────────

export function selectGoalkeeper(state, playerId, gkInstanceId) {
  const player = state.players[playerId]
  const chosen = player.goalkeepers.find(g => g.instanceId === gkInstanceId)
  const reserve = player.goalkeepers.find(g => g.instanceId !== gkInstanceId)

  const updated = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        activeGoalkeeper: { ...chosen, currentDefenseStat: chosen.defenseStat, currentAttackStat: 0 },
        reserveGoalkeeper: reserve ? { ...reserve, currentDefenseStat: reserve.defenseStat } : null,
      },
    },
  }

  // Both players have picked -> deal hands and start
  const bothPicked = playerId === 'B'
    ? updated.players.A.activeGoalkeeper !== null
    : updated.players.B.activeGoalkeeper !== null

  if (bothPicked || playerId === 'B') {
    return dealHandsAndStart(updated)
  }
  return updated
}

function dealStartingHand(deck) {
  const types = ['defense', 'midfield', 'attack']
  const hand = []
  const remaining = [...deck]
  for (const t of types) {
    const idx = remaining.findIndex(c => c.type === t)
    if (idx !== -1) {
      hand.push(...remaining.splice(idx, 1))
    }
  }
  return { hand, deck: remaining }
}

function dealHandsAndStart(state) {
  let s = state
  for (const pid of ['A', 'B']) {
    const player = s.players[pid]
    const { hand, deck } = dealStartingHand(player.deck)
    s = {
      ...s,
      players: { ...s.players, [pid]: { ...player, hand, deck } },
    }
  }
  return addLog(
    { ...s, phase: 'playing', round: 1, currentPlayer: 'A' },
    'Gra rozpoczęta!'
  )
}

// ── Card placement ─────────────────────────────────────────────────────────

export function canPlaceInSector(card, sector) {
  if (sector === 'offense') return card.type === 'attack' || card.type === 'midfield'
  if (sector === 'defense') return card.type === 'defense' || card.type === 'midfield'
  return false
}

export function placeCard(state, playerId, cardInstanceId, sector) {
  if (state.currentPlayer !== playerId) return { state, error: 'Nie twoja tura!' }
  if (state.phase !== 'playing') return { state, error: 'Gra nie jest w toku.' }

  const actionKey = sector === 'offense' ? 'placedOffense' : 'placedDefense'
  if (state.turnActionsUsed[actionKey]) return { state, error: 'Już umieszczono kartę w tym sektorze.' }

  const player = state.players[playerId]
  const card = player.hand.find(c => c.instanceId === cardInstanceId)
  if (!card) return { state, error: 'Karta nie jest w ręce.' }
  if (!canPlaceInSector(card, sector)) return { state, error: `${card.name} nie pasuje do tego sektora.` }

  const sectorKey = sector === 'offense' ? 'offenseSector' : 'defenseSector'
  if (player[sectorKey].length >= MAX_SECTOR_SIZE) return { state, error: 'Sektor pełny (max 3).' }

  const placedCard = { ...card, justPlaced: true, roundsOnField: 0 }
  let newState = {
    ...state,
    turnActionsUsed: { ...state.turnActionsUsed, [actionKey]: true },
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: player.hand.filter(c => c.instanceId !== cardInstanceId),
        [sectorKey]: [...player[sectorKey], placedCard],
      },
    },
  }
  newState = addLog(newState, `${playerId === 'A' ? 'Ty' : 'Przeciwnik'} wystawia ${card.name} (${sector === 'offense' ? 'ofensywa' : 'defensywa'}).`, 'action')
  newState = applyOnPlacementPassive(newState, playerId, placedCard, sector)
  return { state: newState, error: null }
}

// ── On-placement passive effects (fire once when card hits the board) ────────

function applyOnPlacementPassive(state, playerId, card, sector) {
  const pef = card.passiveEffect
  if (!pef || pef.type === 'none') return state
  const opp = playerId === 'A' ? 'B' : 'A'
  const oppPlayer = state.players[opp]
  const ownPlayer = state.players[playerId]
  let newState = state

  const statKey = (s) => s === 'attackStat' ? 'currentAttackStat' : 'currentDefenseStat'

  switch (pef.type) {
    case 'self_stat_change': {
      newState = updateCardStat(newState, playerId, card.instanceId, statKey(pef.stat), pef.amount)
      newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      break
    }
    case 'opponent_stat_change': {
      // Debuff one random opponent card
      const allOpp = [...oppPlayer.offenseSector, ...oppPlayer.defenseSector]
      if (allOpp.length) {
        const target = allOpp[Math.floor(Math.random() * allOpp.length)]
        newState = updateCardStat(newState, opp, target.instanceId, statKey(pef.stat), pef.amount)
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'warning')
      }
      break
    }
    case 'opponent_all_debuff': {
      const allOpp = [...oppPlayer.offenseSector, ...oppPlayer.defenseSector]
      for (const c of allOpp) {
        newState = updateCardStat(newState, opp, c.instanceId, statKey(pef.stat), pef.amount)
      }
      if (allOpp.length) newState = addLog(newState, `${card.name}: ${pef.message}`, 'warning')
      break
    }
    case 'remove_random_opponent': {
      const allOpp = [...oppPlayer.offenseSector, ...oppPlayer.defenseSector]
      if (allOpp.length) {
        const target = allOpp[Math.floor(Math.random() * allOpp.length)]
        newState = removeCardFromBoard(newState, opp, target.instanceId)
        newState = addLog(newState, `${card.name}: ${pef.message} (${target.name})`, 'warning')
      }
      break
    }
    case 'block_opponent_turn': {
      newState = { ...newState, skipTurn: opp }
      newState = addLog(newState, `${card.name}: ${pef.message}`, 'warning')
      break
    }
    case 'self_lock': {
      newState = lockCard(newState, playerId, card.instanceId, pef.rounds)
      newState = addLog(newState, `${card.name}: ${pef.message}`, 'info')
      break
    }
    case 'lock_opponent_sector': {
      const oppOff = newState.players[opp].offenseSector
      const oppDef = newState.players[opp].defenseSector
      for (const c of [...oppOff, ...oppDef]) {
        newState = lockCard(newState, opp, c.instanceId, pef.rounds)
      }
      newState = addLog(newState, `${card.name}: ${pef.message}`, 'warning')
      break
    }
    case 'end_game_next_turn': {
      newState = { ...newState, endGameOnRound: state.round + 1 }
      newState = addLog(newState, `${card.name}: ${pef.message}`, 'special')
      break
    }
    case 'set_max_rounds': {
      newState = { ...newState, maxRounds: pef.rounds }
      newState = addLog(newState, `${card.name}: ${pef.message}`, 'special')
      break
    }
    case 'conditional_double_attack': {
      // Double ATK if this card is the only one in its sector at placement
      const sectorArr = newState.players[playerId][sector === 'offense' ? 'offenseSector' : 'defenseSector']
      const nonSelf = sectorArr.filter(c => c.instanceId !== card.instanceId)
      if (nonSelf.length === 0) {
        const current = card.currentAttackStat ?? 0
        newState = updateCardStat(newState, playerId, card.instanceId, 'currentAttackStat', current)
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      }
      break
    }
    case 'sector_ally_count_buff': {
      // +amount ATK for each ally defender currently on field
      const defenders = ownPlayer.defenseSector.length
      if (defenders > 0) {
        newState = updateCardStat(newState, playerId, card.instanceId, statKey(pef.stat), pef.amount * defenders)
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      }
      break
    }
    case 'sector_enemy_count_buff': {
      // +amount DEF for each opponent currently on field
      const enemies = oppPlayer.offenseSector.length + oppPlayer.defenseSector.length
      if (enemies > 0) {
        newState = updateCardStat(newState, playerId, card.instanceId, statKey(pef.stat), pef.amount * enemies)
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      }
      break
    }
    case 'count_ally_defenders_buff': {
      const defCount = ownPlayer.defenseSector.filter(c => c.type === 'defense').length
      if (defCount > 0) {
        newState = updateCardStat(newState, playerId, card.instanceId, statKey(pef.stat), pef.amount * defCount)
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      }
      break
    }
    case 'count_team_midfield_buff': {
      const mfCount = [...ownPlayer.offenseSector, ...ownPlayer.defenseSector].filter(c => c.type === 'midfield').length
      if (mfCount > 0) {
        newState = updateCardStat(newState, playerId, card.instanceId, 'currentAttackStat', pef.amount * mfCount)
        newState = updateCardStat(newState, playerId, card.instanceId, 'currentDefenseStat', pef.amount * mfCount)
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      }
      break
    }
    case 'absorb_sector_cards': {
      // Gain sum of ATK/DEF of other cards in same sector
      const sArr = newState.players[playerId][sector === 'offense' ? 'offenseSector' : 'defenseSector']
      const others = sArr.filter(c => c.instanceId !== card.instanceId)
      if (others.length) {
        const sumAtk = others.reduce((s, c) => s + (c.currentAttackStat ?? 0), 0)
        const sumDef = others.reduce((s, c) => s + (c.currentDefenseStat ?? 0), 0)
        newState = updateCardStat(newState, playerId, card.instanceId, 'currentAttackStat', sumAtk)
        newState = updateCardStat(newState, playerId, card.instanceId, 'currentDefenseStat', sumDef)
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      }
      break
    }
    case 'absorb_opposite_card': {
      // Gain stats from first opponent card in opposing sector
      const oppSector = sector === 'offense' ? oppPlayer.defenseSector : oppPlayer.offenseSector
      if (oppSector.length) {
        const src = oppSector[0]
        newState = updateCardStat(newState, playerId, card.instanceId, 'currentAttackStat', src.currentAttackStat ?? 0)
        newState = updateCardStat(newState, playerId, card.instanceId, 'currentDefenseStat', src.currentDefenseStat ?? 0)
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      }
      break
    }
    case 'swap_sector_attack_defense': {
      // Swap ATK and DEF for all cards in same sector
      const sKey = sector === 'offense' ? 'offenseSector' : 'defenseSector'
      const swapped = newState.players[playerId][sKey].map(c => ({
        ...c,
        currentAttackStat: c.currentDefenseStat ?? 0,
        currentDefenseStat: c.currentAttackStat ?? 0,
      }))
      newState = {
        ...newState,
        players: { ...newState.players, [playerId]: { ...newState.players[playerId], [sKey]: swapped } },
      }
      newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      break
    }
    case 'team_type_buff': {
      // One-time buff to all own cards of targetType
      const all = [...newState.players[playerId].offenseSector, ...newState.players[playerId].defenseSector]
      for (const c of all) {
        if (c.type === pef.targetType && c.instanceId !== card.instanceId) {
          newState = updateCardStat(newState, playerId, c.instanceId, 'currentAttackStat', pef.atkAmount ?? 0)
          newState = updateCardStat(newState, playerId, c.instanceId, 'currentDefenseStat', pef.defAmount ?? 0)
        }
      }
      if (all.some(c => c.type === pef.targetType))
        newState = addLog(newState, `${card.name}: ${pef.message}`, 'action')
      break
    }
    default:
      break
  }
  return newState
}

// ── Ability activation ─────────────────────────────────────────────────────

export function activateAbility(state, playerId, cardInstanceId) {
  if (state.currentPlayer !== playerId) return { state, error: 'Nie twoja tura!' }
  if (state.turnActionsUsed.activatedAbility) return { state, error: 'Już aktywowano umiejętność.' }

  const player = state.players[playerId]
  const card = findCardOnBoard(player, cardInstanceId)
  if (!card) return { state, error: 'Karta nie jest na boisku.' }
  if (card.justPlaced) return { state, error: 'Karta dopiero wystawiona. Aktywuj od następnej tury.' }
  if (card.isLocked) return { state, error: `${card.name} jest zablokowany.` }
  if (card.abilityType === 'passive') return { state, error: 'Ta umiejętność jest pasywna.' }

  let newState = { ...state, turnActionsUsed: { ...state.turnActionsUsed, activatedAbility: true } }

  if (card.abilityType === 'active_coin') {
    newState = {
      ...newState,
      coinFlipState: { cardInstanceId, player: playerId, result: null, pending: true },
    }
    newState = addLog(newState, `${playerId === 'A' ? 'Ty' : 'Przeciwnik'} aktywuje ${card.abilityName} – rzut żetonem!`, 'action')
    return { state: newState, error: null }
  }

  if (card.abilityType === 'active') {
    newState = applyDirectEffect(newState, playerId, card)
    newState = addLog(newState, `${card.abilityName} aktywowana!`, 'action')
    return { state: newState, error: null }
  }

  return { state, error: 'Nieznany typ umiejętności.' }
}

export function flipCoin(state) {
  if (!state.coinFlipState?.pending) return { state, error: 'Brak oczekującego rzutu.' }
  const result = Math.random() < 0.5 ? 'ball' : 'glove'
  const { cardInstanceId, player: playerId } = state.coinFlipState

  const card = findCardOnBoard(state.players[playerId], cardInstanceId)
  let newState = { ...state, coinFlipState: { ...state.coinFlipState, result, pending: false } }

  const effect = card?.activationEffect?.[result]
  if (effect && effect.type !== 'none') {
    newState = applyCoinEffect(newState, playerId, card, effect)
  }

  newState = addLog(
    newState,
    `Żeton: ${result === 'ball' ? '⚽ Piłka' : '🧤 Rękawica'}! ${effect?.message || ''}`,
    result === 'ball' ? 'success' : 'warning'
  )
  return { state: newState, error: null }
}

function applyDirectEffect(state, playerId, card) {
  const effect = card.activationEffect?.direct
  if (!effect || effect.type === 'none') return state
  return applyCoinEffect(state, playerId, card, effect)
}

function applyCoinEffect(state, playerId, card, effect) {
  const opponent = playerId === 'A' ? 'B' : 'A'
  switch (effect.type) {
    case 'self_stat_change':
      return updateCardStat(state, playerId, card.instanceId, effect.stat || 'currentAttackStat', effect.amount)
    case 'remove_self':
      return removeCardFromBoard(state, playerId, card.instanceId)
    case 'remove_opponent_card': {
      const opp = state.players[opponent]
      const sector = effect.targetSector === 'defense' ? opp.defenseSector : opp.offenseSector
      if (!sector.length) return state
      return removeCardFromBoard(state, opponent, sector[sector.length - 1].instanceId)
    }
    case 'reduce_opponent_attack': {
      const opp = state.players[opponent]
      if (!opp.offenseSector.length) return state
      return updateCardStat(state, opponent, opp.offenseSector[0].instanceId, 'currentAttackStat', -effect.amount)
    }
    case 'remove_opponent_offensive': {
      const opp = state.players[opponent]
      if (!opp.offenseSector.length) return state
      return removeCardFromBoard(state, opponent, opp.offenseSector[opp.offenseSector.length - 1].instanceId)
    }
    case 'block_next_attack':
      return { ...state, players: { ...state.players, [opponent]: { ...state.players[opponent], nextAttackBlocked: true } } }
    case 'opponent_draw_card': {
      const op = state.players[opponent]
      if (!op.deck.length) return state
      return {
        ...state,
        players: {
          ...state.players,
          [opponent]: { ...op, hand: [...op.hand, op.deck[0]], deck: op.deck.slice(1) },
        },
      }
    }
    case 'swap_sector': {
      const p = state.players[playerId]
      if (p.offenseSector.length > 0 && p.defenseSector.length < MAX_SECTOR_SIZE) {
        const mf = p.offenseSector.find(c => c.type === 'midfield')
        if (mf) {
          return {
            ...state,
            players: {
              ...state.players,
              [playerId]: {
                ...p,
                offenseSector: p.offenseSector.filter(c => c.instanceId !== mf.instanceId),
                defenseSector: [...p.defenseSector, mf],
              },
            },
          }
        }
      }
      return state
    }
    case 'self_rounds_on_field_buff': {
      const rounds = card.roundsOnField || 0
      return updateCardStat(state, playerId, card.instanceId, 'currentAttackStat', rounds)
    }
    case 'buff_offense_player': {
      const p = state.players[playerId]
      let s = state
      for (const c of p.offenseSector) {
        s = updateCardStat(s, playerId, c.instanceId, 'currentAttackStat', effect.amount || 2)
      }
      return s
    }
    case 'self_sacrifice_team_buff': {
      let s = removeCardFromBoard(state, playerId, card.instanceId)
      const all = [...s.players[playerId].offenseSector, ...s.players[playerId].defenseSector]
      for (const c of all) {
        s = updateCardStat(s, playerId, c.instanceId, 'currentAttackStat', effect.amount || 5)
      }
      return s
    }
    case 'none':
    default:
      return state
  }
}

// Allow one stat to go negative only if the other stays positive (trade-off design).
// Both stats can never be simultaneously below 0.
function clampStat(card, statKey, newVal) {
  if (newVal >= 0) return newVal
  const otherKey = statKey === 'currentAttackStat' ? 'currentDefenseStat' : 'currentAttackStat'
  const otherVal = card[otherKey] ?? 0
  return otherVal > 0 ? newVal : 0
}

function updateCardStat(state, playerId, instanceId, statKey, delta) {
  const player = state.players[playerId]
  const mapCard = c =>
    c.instanceId === instanceId
      ? { ...c, [statKey]: clampStat(c, statKey, (c[statKey] ?? 0) + delta) }
      : c
  const updatedPlayer = {
    ...player,
    offenseSector: player.offenseSector.map(mapCard),
    defenseSector: player.defenseSector.map(mapCard),
  }
  if (player.activeGoalkeeper?.instanceId === instanceId) {
    const gk = player.activeGoalkeeper
    updatedPlayer.activeGoalkeeper = {
      ...gk,
      [statKey]: clampStat(gk, statKey, (gk[statKey] ?? 0) + delta),
    }
  }
  return { ...state, players: { ...state.players, [playerId]: updatedPlayer } }
}

function removeCardFromBoard(state, playerId, instanceId) {
  const player = state.players[playerId]
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        offenseSector: player.offenseSector.filter(c => c.instanceId !== instanceId),
        defenseSector: player.defenseSector.filter(c => c.instanceId !== instanceId),
      },
    },
  }
}

function findCardOnBoard(player, instanceId) {
  return player.offenseSector.find(c => c.instanceId === instanceId) ||
    player.defenseSector.find(c => c.instanceId === instanceId)
}

// ── End of turn ────────────────────────────────────────────────────────────

export function endTurn(state) {
  if (state.phase !== 'playing') return { state, error: 'Gra nie jest w toku.' }

  // Clear skipTurn flag for the player whose turn is now ending
  let newState = state.skipTurn === state.currentPlayer
    ? { ...state, skipTurn: null }
    : state

  // Apply no-activation effects for current player's unactivated cards
  newState = applyNoActivationEffects(newState, state.currentPlayer)

  // Apply passive effects
  newState = applyPassiveEffects(newState)

  // Increment rounds-on-field counter
  newState = tickRoundsOnField(newState, state.currentPlayer)

  // Resolve goals (only on player A's turn end, representing a full round)
  let goalResult = null
  if (state.currentPlayer === 'A') {
    const stats = computeMatchStats(newState)
    const { playerGoal, aiGoal, playerChance, aiChance } = resolveRoundGoals(
      stats.playerAttack, stats.aiDefense, stats.aiAttack, stats.playerDefense, newState.displayScore
    )

    const newScore = {
      player: newState.displayScore.player + (playerGoal ? 1 : 0),
      ai: newState.displayScore.ai + (aiGoal ? 1 : 0),
    }

    const newGoalEvents = [...newState.goalEvents]
    if (playerGoal) {
      const scorers = newState.players.A.offenseSector
      const scorer = scorers.length > 0 ? scorers[Math.floor(Math.random() * scorers.length)] : null
      newGoalEvents.push({ round: state.round, scorer: 'player', cardId: scorer?.instanceId, cardName: scorer?.name })
      goalResult = { scorer: 'player', score: newScore }
    }
    if (aiGoal) {
      const scorers = newState.players.B.offenseSector
      const scorer = scorers.length > 0 ? scorers[Math.floor(Math.random() * scorers.length)] : null
      newGoalEvents.push({ round: state.round, scorer: 'ai', cardId: scorer?.instanceId, cardName: scorer?.name })
      if (!goalResult) goalResult = { scorer: 'ai', score: newScore }
    }

    newState = { ...newState, displayScore: newScore, goalEvents: newGoalEvents }

    if (playerGoal) newState = addLog(newState, `⚽ GOL! Ty strzelasz! ${newScore.player}:${newScore.ai}`, 'success')
    if (aiGoal) newState = addLog(newState, `⚽ GOL! Przeciwnik strzela! ${newScore.player}:${newScore.ai}`, 'warning')
    if (!playerGoal && !aiGoal) {
      newState = addLog(newState, `Runda ${state.round} bez gola. Atak: ${stats.playerAttack} vs Obrona: ${stats.aiDefense}`, 'info')
    }
  }

  // Draw at start of rounds 3, 5, 7, 9 (both players simultaneously)
  if (state.currentPlayer === 'B' && [2, 4, 6, 8].includes(state.round)) {
    newState = drawCard(newState, 'A')
    newState = drawCard(newState, 'B')
    newState = addLog(newState, `📤 Dobieracie po 1 karcie!`, 'info')
  }

  // Clear justPlaced and tick locks
  newState = clearJustPlaced(newState)
  newState = tickLockedCards(newState)

  // Advance turn
  const nextPlayer = state.currentPlayer === 'A' ? 'B' : 'A'
  const nextRound = state.currentPlayer === 'B' ? state.round + 1 : state.round

  // Special card after round 5
  if (nextRound === 6 && !newState.specialCardRevealed) {
    const drawn = shuffleDeck([...SPECIAL_CARDS])[0]
    newState = { ...newState, specialCard: drawn, specialCardRevealed: true, phase: 'special_card' }
    newState = applySpecialCardEffect(newState, drawn)
    newState = addLog(newState, `🃏 Karta specjalna: ${drawn.name}! ${drawn.description}`, 'special')
  }

  const effectiveMax = newState.maxRounds ?? MAX_ROUNDS
  const silasCut = newState.endGameOnRound != null && nextRound > newState.endGameOnRound
  if (nextRound > effectiveMax || silasCut) {
    return { state: endGame(newState), error: null, goalResult }
  }

  newState = {
    ...newState,
    phase: newState.phase === 'special_card' ? 'special_card' : 'playing',
    round: nextRound,
    currentPlayer: nextPlayer,
    turnActionsUsed: { placedOffense: false, placedDefense: false, activatedAbility: false },
    coinFlipState: null,
  }

  return { state: newState, error: null, goalResult }
}

function applyNoActivationEffects(state, playerId) {
  if (state.turnActionsUsed.activatedAbility) return state
  const player = state.players[playerId]
  let newState = state
  const allCards = [...player.offenseSector, ...player.defenseSector]
  for (const card of allCards) {
    if (!card.noActivationEffect || card.justPlaced) continue
    const effect = card.noActivationEffect
    if (effect.type === 'none') continue
    switch (effect.type) {
      case 'self_stat_change':
        if (effect.perRound || effect.permanent) {
          const key = effect.stat || 'currentAttackStat'
          newState = updateCardStat(newState, playerId, card.instanceId, key, effect.amount)
        }
        break
      case 'opponent_goalkeeper_stat_change': {
        const opp = playerId === 'A' ? 'B' : 'A'
        const oppPlayer = newState.players[opp]
        if (oppPlayer.activeGoalkeeper) {
          newState = updateCardStat(newState, opp, oppPlayer.activeGoalkeeper.instanceId, 'currentDefenseStat', effect.amount)
        }
        break
      }
      case 'self_lock':
        newState = lockCard(newState, playerId, card.instanceId, effect.rounds)
        break
    }
  }
  return newState
}

function lockCard(state, playerId, instanceId, rounds) {
  const player = state.players[playerId]
  const lock = arr => arr.map(c =>
    c.instanceId === instanceId ? { ...c, isLocked: true, lockedRounds: rounds } : c
  )
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        offenseSector: lock(player.offenseSector),
        defenseSector: lock(player.defenseSector),
      },
    },
  }
}

function applyPassiveEffects(state) {
  let newState = state
  const statKey = (s) => s === 'attackStat' ? 'currentAttackStat' : 'currentDefenseStat'

  for (const pid of ['A', 'B']) {
    const opp = pid === 'A' ? 'B' : 'A'
    // Snapshot cards at start of this player's pass (use fresh newState each card)
    const allCards = () => [
      ...newState.players[pid].offenseSector,
      ...newState.players[pid].defenseSector,
    ]

    for (const card of allCards()) {
      if (card.justPlaced) continue
      const pef = card.passiveEffect
      if (!pef) continue

      const inOffense = newState.players[pid].offenseSector.some(c => c.instanceId === card.instanceId)
      const sectorKey = inOffense ? 'offenseSector' : 'defenseSector'

      switch (pef.type) {
        case 'sector_buff': {
          // Buff every other card in same sector each round
          const sectorCards = newState.players[pid][sectorKey]
          for (const ally of sectorCards) {
            if (ally.instanceId === card.instanceId) continue
            newState = updateCardStat(newState, pid, ally.instanceId, statKey(pef.stat), pef.amount)
          }
          break
        }
        case 'per_round_self_stat':
          newState = updateCardStat(newState, pid, card.instanceId, statKey(pef.stat), pef.amount)
          break
        case 'per_round_self_buff':
          newState = updateCardStat(newState, pid, card.instanceId, 'currentAttackStat', pef.amount)
          newState = updateCardStat(newState, pid, card.instanceId, 'currentDefenseStat', pef.amount)
          break
        case 'curse_trade_atk_def': {
          // Owner's attackers -1 atk, defenders +1 def each round
          for (const ally of allCards()) {
            if (ally.type === 'attack')
              newState = updateCardStat(newState, pid, ally.instanceId, 'currentAttackStat', -1)
            if (ally.type === 'defense')
              newState = updateCardStat(newState, pid, ally.instanceId, 'currentDefenseStat', 1)
          }
          break
        }
        case 'opponent_type_debuff': {
          const allOpp = [...newState.players[opp].offenseSector, ...newState.players[opp].defenseSector]
          for (const c of allOpp) {
            if (c.type === pef.targetType)
              newState = updateCardStat(newState, opp, c.instanceId, statKey(pef.stat), pef.amount)
          }
          break
        }
        case 'every2rounds_remove_opponent': {
          const rounds = card.roundsOnField || 0
          if (rounds > 0 && rounds % 2 === 0) {
            const allOpp = [...newState.players[opp].offenseSector, ...newState.players[opp].defenseSector]
            if (allOpp.length) {
              const target = allOpp[Math.floor(Math.random() * allOpp.length)]
              newState = removeCardFromBoard(newState, opp, target.instanceId)
              newState = addLog(newState, `${card.name}: ${pef.message} (${target.name})`, 'warning')
            }
          }
          break
        }
        case 'count_team_type_buff': {
          const mids = allCards().filter(c => c.type === 'midfield' && c.instanceId !== card.instanceId).length
          const defs = allCards().filter(c => c.type === 'defense' && c.instanceId !== card.instanceId).length
          const bonus = Math.floor((mids + defs) / 2)
          if (bonus > 0)
            newState = updateCardStat(newState, pid, card.instanceId, 'currentDefenseStat', pef.amount * bonus)
          break
        }
        case 'swap_team_midfield_stats': {
          const mids = allCards().filter(c => c.type === 'midfield')
          for (const mf of mids) {
            if (mf.instanceId === card.instanceId) continue
            const atk = mf.currentAttackStat ?? 0
            const def = mf.currentDefenseStat ?? 0
            newState = {
              ...newState,
              players: {
                ...newState.players,
                [pid]: {
                  ...newState.players[pid],
                  offenseSector: newState.players[pid].offenseSector.map(c => c.instanceId === mf.instanceId ? { ...c, currentAttackStat: def, currentDefenseStat: atk } : c),
                  defenseSector: newState.players[pid].defenseSector.map(c => c.instanceId === mf.instanceId ? { ...c, currentAttackStat: def, currentDefenseStat: atk } : c),
                },
              },
            }
          }
          break
        }
        default:
          break
      }
    }
  }
  return newState
}

function applySpecialCardEffect(state, card) {
  switch (card.effect.type) {
    case 'global_attack_debuff': {
      let s = state
      for (const pid of ['A', 'B']) {
        const p = s.players[pid]
        s = {
          ...s,
          players: {
            ...s.players,
            [pid]: {
              ...p,
              offenseSector: p.offenseSector.map(c => ({
                ...c,
                currentAttackStat: clampStat(c, 'currentAttackStat', (c.currentAttackStat ?? 0) + card.effect.amount),
              })),
            },
          },
        }
      }
      return s
    }
    case 'underdog_buff': {
      const aCount = state.players.A.offenseSector.length + state.players.A.defenseSector.length
      const bCount = state.players.B.offenseSector.length + state.players.B.defenseSector.length
      const underdog = aCount < bCount ? 'A' : bCount < aCount ? 'B' : null
      if (!underdog) return state
      const p = state.players[underdog]
      const offScore = p.offenseSector.reduce((s, c) => s + (c.currentAttackStat ?? 0), 0)
      const defScore = p.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? 0), 0)
      if (offScore >= defScore) {
        return {
          ...state,
          players: {
            ...state.players,
            [underdog]: {
              ...p,
              offenseSector: p.offenseSector.map(c => ({ ...c, currentAttackStat: clampStat(c, 'currentAttackStat', (c.currentAttackStat ?? 0) + card.effect.amount) })),
            },
          },
        }
      }
      return {
        ...state,
        players: {
          ...state.players,
          [underdog]: {
            ...p,
            defenseSector: p.defenseSector.map(c => ({ ...c, currentDefenseStat: clampStat(c, 'currentDefenseStat', (c.currentDefenseStat ?? 0) + card.effect.amount) })),
          },
        },
      }
    }
    default:
      return state
  }
}

function drawCard(state, playerId) {
  const player = state.players[playerId]
  if (!player.deck.length) return state
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, hand: [...player.hand, player.deck[0]], deck: player.deck.slice(1) },
    },
  }
}

function clearJustPlaced(state) {
  const clear = player => ({
    ...player,
    offenseSector: player.offenseSector.map(c => ({ ...c, justPlaced: false })),
    defenseSector: player.defenseSector.map(c => ({ ...c, justPlaced: false })),
  })
  return { ...state, players: { A: clear(state.players.A), B: clear(state.players.B) } }
}

function tickLockedCards(state) {
  const tick = player => ({
    ...player,
    offenseSector: player.offenseSector.map(c =>
      c.isLocked ? { ...c, lockedRounds: Math.max(0, c.lockedRounds - 1), isLocked: c.lockedRounds > 1 } : c
    ),
    defenseSector: player.defenseSector.map(c =>
      c.isLocked ? { ...c, lockedRounds: Math.max(0, c.lockedRounds - 1), isLocked: c.lockedRounds > 1 } : c
    ),
  })
  return { ...state, players: { A: tick(state.players.A), B: tick(state.players.B) } }
}

function tickRoundsOnField(state, playerId) {
  const player = state.players[playerId]
  const tick = arr => arr.map(c => ({ ...c, roundsOnField: (c.roundsOnField || 0) + 1 }))
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        offenseSector: tick(player.offenseSector),
        defenseSector: tick(player.defenseSector),
      },
    },
  }
}

function endGame(state) {
  const score = state.displayScore
  let winner
  if (score.player > score.ai) winner = 'player'
  else if (score.ai > score.player) winner = 'ai'
  else winner = 'draw'

  let newState = addLog(
    { ...state, phase: 'ended', winner },
    `Koniec meczu! ${score.player}:${score.ai} – ${winner === 'player' ? 'Wygrałeś!' : winner === 'ai' ? 'Przegrana.' : 'Remis!'}`,
    winner === 'player' ? 'success' : winner === 'ai' ? 'warning' : 'info'
  )
  return newState
}

export function dismissSpecialCard(state) {
  return { ...state, phase: 'playing', specialCard: null }
}

// Pull a card from field back into hand (substitution action — uses sector placement slot)
export function substituteCard(state, playerId, cardInstanceId, sector) {
  if (state.currentPlayer !== playerId) return { state, error: 'Nie twoja tura!' }
  if (state.phase !== 'playing') return { state, error: 'Gra nie jest w toku.' }

  const actionKey = sector === 'offense' ? 'placedOffense' : 'placedDefense'
  const player = state.players[playerId]
  const sectorKey = sector === 'offense' ? 'offenseSector' : 'defenseSector'
  const card = player[sectorKey].find(c => c.instanceId === cardInstanceId)
  if (!card) return { state, error: 'Karta nie jest na boisku.' }

  // Pull back into hand, mark sector action used so player can still place another
  const restoredCard = { ...card, justPlaced: false, roundsOnField: card.roundsOnField || 0 }
  let newState = {
    ...state,
    turnActionsUsed: { ...state.turnActionsUsed, [actionKey]: false }, // free up the slot for new placement
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: [...player.hand, restoredCard],
        [sectorKey]: player[sectorKey].filter(c => c.instanceId !== cardInstanceId),
      },
    },
  }
  newState = addLog(newState, `Zmiana: ${card.name} wraca na ławkę.`, 'action')
  return { state: newState, error: null }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_GOALKEEPER':
      return selectGoalkeeper(state, action.playerId, action.gkInstanceId)
    case 'PLACE_CARD': {
      const { state: next, error } = placeCard(state, action.playerId, action.cardInstanceId, action.sector)
      return error ? state : next
    }
    case 'SUBSTITUTE_CARD': {
      const { state: next, error } = substituteCard(state, action.playerId, action.cardInstanceId, action.sector)
      return error ? state : next
    }
    case 'ACTIVATE_ABILITY': {
      const { state: next, error } = activateAbility(state, action.playerId, action.cardInstanceId)
      return error ? state : next
    }
    case 'FLIP_COIN': {
      const { state: next } = flipCoin(state)
      return next
    }
    case 'DISMISS_COIN':
      return { ...state, coinFlipState: null }
    case 'END_TURN': {
      const { state: next } = endTurn(state)
      return next
    }
    case 'DISMISS_SPECIAL_CARD':
      return dismissSpecialCard(state)
    case 'FORFEIT': {
      const s = {
        ...state,
        displayScore: { player: 0, ai: 3 },
        phase: 'ended',
        winner: 'ai',
      }
      return addLog(s, 'Mecz poddany. Przegrana 0:3.', 'warning')
    }
    case 'REDRAW_HAND': {
      if (state.redraws >= 2) return addLog(state, '❌ Wykorzystałeś już limit 2 przetasowań.', 'error')
      const pl = state.players.A
      const combined = shuffleDeck([...pl.deck, ...pl.hand])
      const newHand = combined.slice(0, 4)
      const newDeck = combined.slice(4)
      // -5 total DEF penalty: subtract from GK first, then from first defense card
      let defLeft = 5
      let updatedGK = pl.activeGoalkeeper
      if (updatedGK && defLeft > 0) {
        const take = Math.min(defLeft, updatedGK.currentDefenseStat ?? 0)
        updatedGK = { ...updatedGK, currentDefenseStat: (updatedGK.currentDefenseStat ?? 0) - take }
        defLeft -= take
      }
      let updatedDef = [...pl.defenseSector]
      for (let i = 0; i < updatedDef.length && defLeft > 0; i++) {
        const take = Math.min(defLeft, updatedDef[i].currentDefenseStat ?? 0)
        updatedDef[i] = { ...updatedDef[i], currentDefenseStat: (updatedDef[i].currentDefenseStat ?? 0) - take }
        defLeft -= take
      }
      const newState = {
        ...state,
        redraws: state.redraws + 1,
        players: {
          ...state.players,
          A: { ...pl, hand: newHand, deck: newDeck, activeGoalkeeper: updatedGK, defenseSector: updatedDef },
        },
      }
      return addLog(newState, `🔄 Przetasowanie ${state.redraws + 1}/2 — dobrano 4 karty, -5 DEF do końca meczu.`, 'warning')
    }
    default:
      return state
  }
}
