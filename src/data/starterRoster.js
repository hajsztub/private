import STARTER_CARDS_RAW from './starter-cards.json'
import STARTER_CARD_DEFINITIONS_RAW from './starter-card-definitions.json'

export const STARTER_CARDS = STARTER_CARDS_RAW
export const STARTER_CARD_DEFINITIONS = STARTER_CARD_DEFINITIONS_RAW

export function createStarterAIDeck() {
  const ids = [
    'starter_gk1',
    'starter_def1', 'starter_def2', 'starter_def3', 'starter_def4',
    'starter_mid1', 'starter_mid2', 'starter_mid3',
    'starter_atk1', 'starter_atk2', 'starter_atk3',
  ]
  return ids.map((id, i) => {
    const def = STARTER_CARD_DEFINITIONS.find(d => d.id === id)
    if (!def) return null
    return {
      ...def,
      instanceId: `ai_${id}_${i}`,
      currentAttackStat: def.attackStat,
      currentDefenseStat: def.defenseStat,
      isLocked: false, lockedRounds: 0, justPlaced: false, faceDown: false, upgradeLevel: 0,
    }
  }).filter(Boolean)
}
