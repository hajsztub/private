// AI decision engine - plays as player 'B'

const AI_THINK_DELAY = 600  // ms between AI actions
const AI_PLACE_DELAY = 400

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function canPlaceInSector(card, sector) {
  if (sector === 'offense') return card.type === 'attack' || card.type === 'midfield'
  if (sector === 'defense') return card.type === 'defense' || card.type === 'midfield'
  return false
}

function pickBestCard(hand, sector) {
  const eligible = hand.filter(c => canPlaceInSector(c, sector))
  if (eligible.length === 0) return null
  // Sort by primary stat descending
  return eligible.sort((a, b) => {
    if (sector === 'offense') return (b.currentAttackStat ?? b.attackStat ?? 0) - (a.currentAttackStat ?? a.attackStat ?? 0)
    return (b.currentDefenseStat ?? b.defenseStat ?? 0) - (a.currentDefenseStat ?? a.defenseStat ?? 0)
  })[0]
}

function shouldActivateAbility(card, aiAttack, playerDefense) {
  if (card.abilityType === 'passive') return false
  if (card.isLocked || card.justPlaced) return false
  // Activate if we're behind or it's a guaranteed buff
  if (card.abilityType === 'active') return true
  if (card.abilityType === 'active_coin') {
    // Take the risk if we're behind by more than 3
    return aiAttack < playerDefense + 3
  }
  return false
}

export async function runAITurn(gameState, dispatch, setAiThinking) {
  const aiPlayer = gameState.players.B
  const playerA = gameState.players.A

  setAiThinking?.(true)
  await sleep(AI_THINK_DELAY)

  const playerADefense =
    playerA.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? 0), 0) +
    (playerA.activeGoalkeeper?.currentDefenseStat ?? 0)

  const aiCurrentAttack = aiPlayer.offenseSector.reduce((s, c) => s + (c.currentAttackStat ?? 0), 0)

  // 1. Place offense card
  if (!gameState.turnActionsUsed.placedOffense && aiPlayer.offenseSector.length < 3) {
    const card = pickBestCard(aiPlayer.hand, 'offense')
    if (card) {
      dispatch({ type: 'PLACE_CARD', playerId: 'B', cardInstanceId: card.instanceId, sector: 'offense' })
      await sleep(AI_PLACE_DELAY)
    }
  }

  // 2. Place defense card
  if (!gameState.turnActionsUsed.placedDefense && aiPlayer.defenseSector.length < 3) {
    const updatedHand = gameState.players.B.hand // Note: state may not have updated yet due to React batching
    const card = pickBestCard(updatedHand, 'defense')
    if (card) {
      dispatch({ type: 'PLACE_CARD', playerId: 'B', cardInstanceId: card.instanceId, sector: 'defense' })
      await sleep(AI_PLACE_DELAY)
    }
  }

  // 3. Maybe activate an ability
  if (!gameState.turnActionsUsed.activatedAbility) {
    const allAICards = [...aiPlayer.offenseSector, ...aiPlayer.defenseSector]
    const activatable = allAICards.filter(c =>
      !c.justPlaced && !c.isLocked && c.abilityType !== 'passive'
    )
    if (activatable.length > 0) {
      const card = activatable[0]
      if (shouldActivateAbility(card, aiCurrentAttack, playerADefense)) {
        dispatch({ type: 'ACTIVATE_ABILITY', playerId: 'B', cardInstanceId: card.instanceId })
        await sleep(AI_PLACE_DELAY)

        // If it needs a coin flip, flip it
        if (card.abilityType === 'active_coin') {
          await sleep(800) // wait for coin flip modal
          dispatch({ type: 'FLIP_COIN' })
          await sleep(1400) // wait for animation
          dispatch({ type: 'DISMISS_COIN' })
          await sleep(300)
        }
      }
    }
  }

  await sleep(300)
  setAiThinking?.(false)

  // 4. End turn
  dispatch({ type: 'END_TURN' })
}

export function pickAIGoalkeeper(goalkeepers) {
  // Pick the one with higher defense stat
  return goalkeepers.reduce((best, gk) =>
    (gk.defenseStat ?? 0) > (best.defenseStat ?? 0) ? gk : best
  )
}
