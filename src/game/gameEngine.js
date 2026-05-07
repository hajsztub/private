import { createDeck, separateDeck, SPECIAL_CARDS, shuffleDeck } from '../data/cards.js'

export const MAX_ROUNDS = 10 // 5 per player
export const MAX_SECTOR_SIZE = 3
export const HAND_SIZE = 4

export function createInitialState() {
  const deckA = createDeck('A')
  const deckB = createDeck('B')
  const { goalkeepers: gkA, players: playersA } = separateDeck(deckA)
  const { goalkeepers: gkB, players: playersB } = separateDeck(deckB)

  return {
    phase: 'setup', // setup | goalkeeper_selection | playing | special_card | ended
    round: 0,
    currentPlayer: 'A', // whose turn it is
    turnActionsUsed: {
      placedOffense: false,
      placedDefense: false,
      activatedAbility: false,
    },
    players: {
      A: {
        id: 'A',
        name: 'Gracz A',
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
        name: 'Gracz B',
        deck: playersB,
        hand: [],
        goalkeepers: gkB,
        activeGoalkeeper: null,
        reserveGoalkeeper: null,
        offenseSector: [],
        defenseSector: [],
      },
    },
    setupStep: 'A_picks_goalkeeper', // A_picks_goalkeeper | B_picks_goalkeeper | deal_hands
    specialCard: null,
    specialCardRevealed: false,
    log: [],
    coinFlipState: null, // null | { cardInstanceId, player, result, pending }
    pendingAction: null,
    winner: null,
    scores: null,
  }
}

export function addLog(state, message, type = 'info') {
  return {
    ...state,
    log: [{ message, type, round: state.round }, ...state.log].slice(0, 50),
  }
}

// ── Setup ──────────────────────────────────────────────────────────────────

export function selectGoalkeeper(state, playerId, gkInstanceId) {
  const player = state.players[playerId]
  const chosen = player.goalkeepers.find(g => g.instanceId === gkInstanceId)
  const reserve = player.goalkeepers.find(g => g.instanceId !== gkInstanceId)

  const newState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        activeGoalkeeper: { ...chosen, currentDefenseStat: chosen.defenseStat },
        reserveGoalkeeper: reserve ? { ...reserve, currentDefenseStat: reserve.defenseStat } : null,
      },
    },
  }

  if (state.setupStep === 'A_picks_goalkeeper') {
    return addLog({ ...newState, setupStep: 'B_picks_goalkeeper' }, `Gracz A wybrał bramkarza: ${chosen.name}`)
  } else {
    const withLog = addLog(newState, `Gracz B wybrał bramkarza: ${chosen.name}`)
    return dealHands(withLog)
  }
}

function dealHands(state) {
  let s = state
  for (const pid of ['A', 'B']) {
    const player = s.players[pid]
    const hand = player.deck.slice(0, HAND_SIZE)
    const remainingDeck = player.deck.slice(HAND_SIZE)
    s = {
      ...s,
      players: {
        ...s.players,
        [pid]: { ...player, hand, deck: remainingDeck },
      },
    }
  }
  return addLog({ ...s, phase: 'playing', round: 1, setupStep: null }, 'Gra rozpoczęta! Tura Gracza A.')
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
  if (state.turnActionsUsed[actionKey]) return { state, error: `Już umieszczono kartę w tym sektorze w tej turze.` }

  const player = state.players[playerId]
  const card = player.hand.find(c => c.instanceId === cardInstanceId)
  if (!card) return { state, error: 'Karta nie jest w ręce.' }
  if (!canPlaceInSector(card, sector)) return { state, error: `${card.name} nie może trafić do sektora ${sector === 'offense' ? 'ofensywnego' : 'defensywnego'}.` }

  const sectorKey = sector === 'offense' ? 'offenseSector' : 'defenseSector'
  if (player[sectorKey].length >= MAX_SECTOR_SIZE) return { state, error: 'Sektor jest pełny (max 3 zawodników).' }

  const placedCard = { ...card, justPlaced: true, faceDown: true }
  const newHand = player.hand.filter(c => c.instanceId !== cardInstanceId)
  const newSector = [...player[sectorKey], placedCard]

  let newState = {
    ...state,
    turnActionsUsed: { ...state.turnActionsUsed, [actionKey]: true },
    players: {
      ...state.players,
      [playerId]: { ...player, hand: newHand, [sectorKey]: newSector },
    },
  }
  newState = addLog(newState, `Gracz ${playerId} wystawia kartę (zakrytą) do sektora ${sector === 'offense' ? 'ofensywnego' : 'defensywnego'}.`)
  return { state: newState, error: null }
}

// ── Ability activation ─────────────────────────────────────────────────────

export function activateAbility(state, playerId, cardInstanceId) {
  if (state.currentPlayer !== playerId) return { state, error: 'Nie twoja tura!' }
  if (state.turnActionsUsed.activatedAbility) return { state, error: 'Już aktywowano umiejętność w tej turze.' }

  const player = state.players[playerId]
  const card = findCardOnBoard(player, cardInstanceId)
  if (!card) return { state, error: 'Karta nie jest na planszy.' }
  if (card.justPlaced) return { state, error: 'Karta dopiero co została wystawiona. Można aktywować od następnej tury.' }
  if (card.isLocked) return { state, error: `${card.name} jest zablokowany na ${card.lockedRounds} rundę/rundy.` }
  if (card.abilityType === 'passive') return { state, error: 'Ta umiejętność jest pasywna i aktywuje się automatycznie.' }

  let newState = { ...state, turnActionsUsed: { ...state.turnActionsUsed, activatedAbility: true } }

  if (card.abilityType === 'active_coin') {
    newState = {
      ...newState,
      coinFlipState: { cardInstanceId, player: playerId, result: null, pending: true },
    }
    newState = addLog(newState, `Gracz ${playerId} aktywuje ${card.abilityName} (${card.name}) – rzut żetonem!`, 'action')
    return { state: newState, error: null }
  }

  if (card.abilityType === 'active') {
    newState = applyDirectEffect(newState, playerId, card)
    newState = addLog(newState, `Gracz ${playerId} aktywuje ${card.abilityName} (${card.name})!`, 'action')
    return { state: newState, error: null }
  }

  return { state, error: 'Nieznany typ umiejętności.' }
}

export function flipCoin(state) {
  if (!state.coinFlipState || !state.coinFlipState.pending) return { state, error: 'Brak oczekującego rzutu.' }
  const result = Math.random() < 0.5 ? 'ball' : 'glove'
  const { cardInstanceId, player: playerId } = state.coinFlipState

  const playerData = state.players[playerId]
  const card = findCardOnBoard(playerData, cardInstanceId)

  let newState = {
    ...state,
    coinFlipState: { ...state.coinFlipState, result, pending: false },
  }

  const effect = card.activationEffect?.[result]
  if (effect) {
    newState = applyCoinEffect(newState, playerId, card, effect, result)
  }

  newState = addLog(newState, `Żeton: ${result === 'ball' ? '⚽ Piłka' : '🧤 Rękawica'}! ${effect?.message || ''}`, result === 'ball' ? 'success' : 'warning')
  return { state: newState, error: null }
}

function applyDirectEffect(state, playerId, card) {
  const effect = card.activationEffect?.direct
  if (!effect) return state
  return applyCoinEffect(state, playerId, card, effect, 'direct')
}

function applyCoinEffect(state, playerId, card, effect, _result) {
  const opponent = playerId === 'A' ? 'B' : 'A'

  switch (effect.type) {
    case 'self_stat_change':
      return updateCardStat(state, playerId, card.instanceId, effect.stat, effect.amount)

    case 'remove_self':
      return removeCardFromBoard(state, playerId, card.instanceId)

    case 'remove_opponent_card': {
      const opponentPlayer = state.players[opponent]
      const targetSector = effect.targetSector === 'defense' ? opponentPlayer.defenseSector : opponentPlayer.offenseSector
      if (targetSector.length === 0) return state
      // Remove last card (could be made interactive)
      const target = targetSector[targetSector.length - 1]
      return removeCardFromBoard(state, opponent, target.instanceId)
    }

    case 'reduce_opponent_attack': {
      const opponentPlayer = state.players[opponent]
      const allOpponentCards = [...opponentPlayer.offenseSector]
      if (allOpponentCards.length === 0) return state
      const target = allOpponentCards[0]
      return updateCardStat(state, opponent, target.instanceId, 'currentAttackStat', -effect.amount)
    }

    case 'remove_opponent_offensive': {
      const opponentPlayer = state.players[opponent]
      if (opponentPlayer.offenseSector.length === 0) return state
      const target = opponentPlayer.offenseSector[opponentPlayer.offenseSector.length - 1]
      return removeCardFromBoard(state, opponent, target.instanceId)
    }

    case 'block_next_attack':
      return { ...state, players: { ...state.players, [opponent]: { ...state.players[opponent], nextAttackBlocked: true } } }

    case 'opponent_draw_card': {
      const op = state.players[opponent]
      if (op.deck.length === 0) return state
      const drawn = op.deck[0]
      return {
        ...state,
        players: {
          ...state.players,
          [opponent]: { ...op, hand: [...op.hand, drawn], deck: op.deck.slice(1) },
        },
      }
    }

    case 'swap_sector': {
      // Move first offense card to defense or vice versa (simplified)
      const p = state.players[playerId]
      if (p.offenseSector.length > 0 && p.defenseSector.length < MAX_SECTOR_SIZE) {
        const cardToMove = p.offenseSector[0]
        if (cardToMove.type === 'defense' || cardToMove.type === 'midfield') {
          return {
            ...state,
            players: {
              ...state.players,
              [playerId]: {
                ...p,
                offenseSector: p.offenseSector.slice(1),
                defenseSector: [...p.defenseSector, cardToMove],
              },
            },
          }
        }
      }
      return state
    }

    default:
      return state
  }
}

function updateCardStat(state, playerId, instanceId, statKey, delta) {
  const player = state.players[playerId]

  const updateInArray = (arr) =>
    arr.map(c =>
      c.instanceId === instanceId
        ? { ...c, [statKey]: Math.max(0, (c[statKey] ?? 0) + delta) }
        : c
    )

  const updatedPlayer = {
    ...player,
    offenseSector: updateInArray(player.offenseSector),
    defenseSector: updateInArray(player.defenseSector),
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
  return (
    player.offenseSector.find(c => c.instanceId === instanceId) ||
    player.defenseSector.find(c => c.instanceId === instanceId)
  )
}

// ── End of turn ────────────────────────────────────────────────────────────

export function endTurn(state) {
  if (state.phase !== 'playing') return { state, error: 'Gra nie jest w toku.' }

  // Reveal newly placed cards
  let newState = revealNewCards(state)

  // Apply no-activation effects for cards that weren't activated
  newState = applyNoActivationEffects(newState, state.currentPlayer)

  // Apply passive effects
  newState = applyPassiveEffects(newState)

  // Draw a card for the current player
  newState = drawCard(newState, state.currentPlayer)

  const nextPlayer = state.currentPlayer === 'A' ? 'B' : 'A'
  const nextRound = state.currentPlayer === 'B' ? state.round + 1 : state.round

  // Unset justPlaced flag
  newState = clearJustPlaced(newState)

  // Tick locked cards
  newState = tickLockedCards(newState, nextPlayer)

  // Check for special card at round 5
  if (nextRound === 6 && !newState.specialCardRevealed) {
    const specialCards = shuffleDeck(SPECIAL_CARDS)
    const drawn = specialCards[0]
    newState = { ...newState, specialCard: drawn, specialCardRevealed: true, phase: 'special_card' }
    newState = addLog(newState, `Karta specjalna: ${drawn.name}! ${drawn.description}`, 'special')
    newState = applySpecialCardEffect(newState, drawn)
  }

  if (nextRound > MAX_ROUNDS) {
    return endGame(newState)
  }

  newState = {
    ...newState,
    phase: newState.phase === 'special_card' ? 'special_card' : 'playing',
    round: nextRound,
    currentPlayer: nextPlayer,
    turnActionsUsed: { placedOffense: false, placedDefense: false, activatedAbility: false },
    coinFlipState: null,
  }

  newState = addLog(newState, `Tura Gracza ${nextPlayer} (Runda ${nextRound}).`)
  return { state: newState, error: null }
}

function revealNewCards(state) {
  const revealInPlayer = (player) => ({
    ...player,
    offenseSector: player.offenseSector.map(c => ({ ...c, faceDown: false })),
    defenseSector: player.defenseSector.map(c => ({ ...c, faceDown: false })),
  })
  return {
    ...state,
    players: {
      A: revealInPlayer(state.players.A),
      B: revealInPlayer(state.players.B),
    },
  }
}

function clearJustPlaced(state) {
  const clearInPlayer = (player) => ({
    ...player,
    offenseSector: player.offenseSector.map(c => ({ ...c, justPlaced: false })),
    defenseSector: player.defenseSector.map(c => ({ ...c, justPlaced: false })),
  })
  return {
    ...state,
    players: {
      A: clearInPlayer(state.players.A),
      B: clearInPlayer(state.players.B),
    },
  }
}

function tickLockedCards(state, _nextPlayer) {
  const tick = (player) => ({
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

function applyNoActivationEffects(state, playerId) {
  // Only applies if ability was not activated this turn
  if (state.turnActionsUsed.activatedAbility) return state

  const player = state.players[playerId]
  let newState = state

  const allCards = [...player.offenseSector, ...player.defenseSector]
  for (const card of allCards) {
    if (!card.noActivationEffect || card.justPlaced) continue
    const effect = card.noActivationEffect
    switch (effect.type) {
      case 'self_stat_change':
        if (effect.perRound) {
          newState = updateCardStat(newState, playerId, card.instanceId, 'currentAttackStat', effect.amount)
        } else if (effect.permanent) {
          newState = updateCardStat(newState, playerId, card.instanceId, 'currentAttackStat', effect.amount)
        }
        break
      case 'opponent_goalkeeper_stat_change': {
        const opponent = playerId === 'A' ? 'B' : 'A'
        const op = newState.players[opponent]
        if (op.activeGoalkeeper) {
          newState = updateCardStat(newState, opponent, op.activeGoalkeeper.instanceId, 'currentDefenseStat', effect.amount)
        }
        break
      }
      case 'self_lock':
        newState = lockCard(newState, playerId, card.instanceId, effect.rounds)
        break
      default:
        break
    }
  }
  return newState
}

function lockCard(state, playerId, instanceId, rounds) {
  const player = state.players[playerId]
  const lockInArr = arr => arr.map(c =>
    c.instanceId === instanceId ? { ...c, isLocked: true, lockedRounds: rounds } : c
  )
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        offenseSector: lockInArr(player.offenseSector),
        defenseSector: lockInArr(player.defenseSector),
      },
    },
  }
}

function applyPassiveEffects(state) {
  // Marco: sector buff
  let newState = state
  for (const pid of ['A', 'B']) {
    const player = newState.players[pid]
    const sectors = [
      { key: 'offenseSector', cards: player.offenseSector },
      { key: 'defenseSector', cards: player.defenseSector },
    ]
    for (const { key, cards } of sectors) {
      const hasMarco = cards.some(c => c.id === 'marco')
      if (hasMarco) {
        const buffed = cards.map(c =>
          c.id !== 'marco' ? { ...c, currentDefenseStat: c.currentDefenseStat + 1 } : c
        )
        newState = {
          ...newState,
          players: { ...newState.players, [pid]: { ...newState.players[pid], [key]: buffed } },
        }
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
        const player = s.players[pid]
        const debuffed = player.offenseSector.map(c => ({
          ...c,
          currentAttackStat: Math.max(0, c.currentAttackStat + card.effect.amount),
        }))
        s = { ...s, players: { ...s.players, [pid]: { ...player, offenseSector: debuffed } } }
      }
      return s
    }
    case 'underdog_buff': {
      const aCount = state.players.A.offenseSector.length + state.players.A.defenseSector.length
      const bCount = state.players.B.offenseSector.length + state.players.B.defenseSector.length
      const underdog = aCount < bCount ? 'A' : bCount < aCount ? 'B' : null
      if (!underdog) return state
      const p = state.players[underdog]
      const totalOffense = p.offenseSector.reduce((s, c) => s + c.currentAttackStat, 0)
      const totalDefense = p.defenseSector.reduce((s, c) => s + c.currentDefenseStat, 0)
      const buffStat = totalOffense >= totalDefense ? 'currentAttackStat' : 'currentDefenseStat'
      const sector = buffStat === 'currentAttackStat' ? 'offenseSector' : 'defenseSector'
      const buffed = p[sector].map(c => ({ ...c, [buffStat]: c[buffStat] + card.effect.amount }))
      return { ...state, players: { ...state.players, [underdog]: { ...p, [sector]: buffed } } }
    }
    default:
      return state
  }
}

function drawCard(state, playerId) {
  const player = state.players[playerId]
  if (player.deck.length === 0) return state
  const drawn = player.deck[0]
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, hand: [...player.hand, drawn], deck: player.deck.slice(1) },
    },
  }
}

// ── End game ───────────────────────────────────────────────────────────────

export function calculateScores(state) {
  const scores = {}
  for (const pid of ['A', 'B']) {
    const player = state.players[pid]
    const attack = player.offenseSector.reduce((s, c) => s + (c.currentAttackStat ?? 0), 0)
    const defense =
      player.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? 0), 0) +
      (player.activeGoalkeeper?.currentDefenseStat ?? 0)
    scores[pid] = { attack, defense }
  }
  return scores
}

function endGame(state) {
  const scores = calculateScores(state)
  let winner = null
  let newState = { ...state, phase: 'ended', scores }

  if (scores.A.attack > scores.B.defense && scores.A.attack > scores.B.attack) {
    winner = 'A'
  } else if (scores.B.attack > scores.A.defense && scores.B.attack > scores.A.attack) {
    winner = 'B'
  } else if (scores.A.attack > scores.B.defense) {
    winner = 'A'
  } else if (scores.B.attack > scores.A.defense) {
    winner = 'B'
  } else {
    winner = 'draw'
  }

  newState = { ...newState, winner }
  newState = addLog(newState, `Gra zakończona! Wyniki: A(ATK ${scores.A.attack} vs DEF ${scores.B.defense}) | B(ATK ${scores.B.attack} vs DEF ${scores.A.defense})`, 'special')
  if (winner === 'draw') {
    newState = addLog(newState, 'Remis! Przeprowadź ostatni rzut żetonem.', 'warning')
  } else {
    newState = addLog(newState, `Wygrywa Gracz ${winner}!`, 'success')
  }
  return { state: newState, error: null }
}

export function dismissSpecialCard(state) {
  return { ...state, phase: 'playing', specialCard: null }
}
