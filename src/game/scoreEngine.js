// Realistic football score simulation using sigmoid probability

const MAX_GOALS_PER_TEAM = 5

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

export function computeGoalChance(attackTotal, defenseTotal) {
  const diff = attackTotal - defenseTotal
  // Base 17% chance at equal stats → ~1.7 goals/team expected per match
  // Scales up to ~30% at strong advantage, never below 5%
  return 0.05 + 0.25 * sigmoid(diff / 15)
}

export function resolveRoundGoals(playerAttack, aiDefense, aiAttack, playerDefense, currentScore) {
  const playerChance = computeGoalChance(playerAttack, aiDefense)
  const aiChance = computeGoalChance(aiAttack, playerDefense)

  let playerGoal = false
  let aiGoal = false

  if (currentScore.player < MAX_GOALS_PER_TEAM) {
    playerGoal = Math.random() < playerChance
  }
  if (currentScore.ai < MAX_GOALS_PER_TEAM) {
    aiGoal = Math.random() < aiChance
  }

  return { playerGoal, aiGoal, playerChance, aiChance }
}

export function computeMatchStats(state) {
  const p = state.players.A
  const ai = state.players.B

  const playerAttack = p.offenseSector.reduce((s, c) => s + (c.currentAttackStat ?? 0), 0)
  const playerDefense =
    p.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? 0), 0) +
    (p.activeGoalkeeper?.currentDefenseStat ?? 0)

  const aiAttack = ai.offenseSector.reduce((s, c) => s + (c.currentAttackStat ?? 0), 0)
  const aiDefense =
    ai.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? 0), 0) +
    (ai.activeGoalkeeper?.currentDefenseStat ?? 0)

  return { playerAttack, playerDefense, aiAttack, aiDefense }
}

export function computeRewardCoins(result, matchType, scoreDiff) {
  const base =
    matchType === 'league'           ? { win: 280, draw: 100, loss: 50 } :
    matchType === 'training_amateur' ? { win: 30,  draw: 10,  loss: 4  } :
    matchType === 'training_pro'     ? { win: 150, draw: 45,  loss: 18 } :
                                       { win: 60,  draw: 20,  loss: 10 }  // local fallback

  let coins = base[result] ?? 0
  if (result === 'win') coins += Math.min(scoreDiff * 15, 60)
  return coins
}

export function computeRatingChange(result, matchType) {
  if (matchType !== 'league') return 0
  return { win: 25, draw: 5, loss: -15 }[result] ?? 0
}

export function determinePlayerOfMatch(goalEvents, playerSectors, aiSectors) {
  // Count goal involvements per card
  const involvement = {}
  for (const ev of goalEvents) {
    if (ev.scorer === 'player' && ev.cardId) {
      involvement[ev.cardId] = (involvement[ev.cardId] || 0) + 2
    }
  }
  // Also weight by stats contributed
  const allPlayerCards = [...(playerSectors.offense || []), ...(playerSectors.defense || [])]
  let best = null
  let bestScore = -1
  for (const card of allPlayerCards) {
    const inv = involvement[card.instanceId] || 0
    const statScore = (card.currentAttackStat ?? 0) + (card.currentDefenseStat ?? 0) + inv
    if (statScore > bestScore) {
      bestScore = statScore
      best = card
    }
  }
  return best
}
