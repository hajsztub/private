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

function dealHandsAndStart(state) {
  let s = state
  for (const pid of ['A', 'B']) {
    const player = s.players[pid]
    const hand = player.deck.slice(0, HAND_SIZE)
    const deck = player.deck.slice(HAND_SIZE)
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
  return { state: newState, error: null }
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
    case 'none':
    default:
      return state
  }
}

function updateCardStat(state, playerId, instanceId, statKey, delta) {
  const player = state.players[playerId]
  const mapCard = c =>
    c.instanceId === instanceId
      ? { ...c, [statKey]: Math.max(0, (c[statKey] ?? 0) + delta) }
      : c
  const updatedPlayer = {
    ...player,
    offenseSector: player.offenseSector.map(mapCard),
    defenseSector: player.defenseSector.map(mapCard),
  }
  if (player.activeGoalkeeper?.instanceId === instanceId) {
    updatedPlayer.activeGoalkeeper = {
      ...player.activeGoalkeeper,
      [statKey]: Math.max(0, (player.activeGoalkeeper[statKey] ?? 0) + delta),
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

  let newState = state

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

  // Draw a card for the current player
  newState = drawCard(newState, state.currentPlayer)

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

  if (nextRound > MAX_ROUNDS) {
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
  for (const pid of ['A', 'B']) {
    const player = newState.players[pid]
    const hasMarcroInSector = (sector) => sector.some(c => c.id === 'marco')
    const buffSector = (sector) => sector.map(c =>
      c.id !== 'marco' ? { ...c, currentDefenseStat: (c.currentDefenseStat ?? 0) + 1 } : c
    )
    let updated = { ...player }
    if (hasMarcroInSector(player.offenseSector)) updated.offenseSector = buffSector(player.offenseSector)
    if (hasMarcroInSector(player.defenseSector)) updated.defenseSector = buffSector(player.defenseSector)
    newState = { ...newState, players: { ...newState.players, [pid]: updated } }
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
                currentAttackStat: Math.max(0, (c.currentAttackStat ?? 0) + card.effect.amount),
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
              offenseSector: p.offenseSector.map(c => ({ ...c, currentAttackStat: (c.currentAttackStat ?? 0) + card.effect.amount })),
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
            defenseSector: p.defenseSector.map(c => ({ ...c, currentDefenseStat: (c.currentDefenseStat ?? 0) + card.effect.amount })),
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

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SELECT_GOALKEEPER':
      return selectGoalkeeper(state, action.playerId, action.gkInstanceId)
    case 'PLACE_CARD': {
      const { state: next, error } = placeCard(state, action.playerId, action.cardInstanceId, action.sector)
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
    default:
      return state
  }
}
