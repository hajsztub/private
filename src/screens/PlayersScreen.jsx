import React, { useState } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import PlayerCard from '../components/PlayerCard'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import './PlayersScreen.css'

const ALL_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

function getCardDef(cardId) {
  return ALL_DEFS.find(d => d.id === cardId)
}

function buildDisplayCard(owned, def) {
  if (!def) return null
  const bonus = (owned.upgradeLevel || 0) * (def.upgradeStatBonus || 1)
  const isPrimAtk = def.type === 'attack' || (def.type === 'midfield' && def.attackStat >= def.defenseStat)
  return {
    ...def,
    instanceId: owned.instanceId,
    currentAttackStat: def.attackStat + (isPrimAtk ? bonus : 0),
    currentDefenseStat: def.defenseStat + (!isPrimAtk || def.type === 'goalkeeper' || def.type === 'defense' ? bonus : 0),
    upgradeLevel: owned.upgradeLevel || 0,
    isStarter: owned.isStarter,
  }
}

export default function PlayersScreen() {
  const { goBack } = useRouter()
  const { profile, upgradeCard } = useProfile()
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const displayCards = profile.ownedCards
    .map(o => ({ owned: o, def: getCardDef(o.cardId), card: buildDisplayCard(o, getCardDef(o.cardId)) }))
    .filter(x => x.card !== null)
    .filter(x => filter === 'all' || x.def?.type === filter)

  const selectedEntry = selected ? displayCards.find(x => x.owned.instanceId === selected) : null
  const selectedCard = selectedEntry?.card
  const selectedDef = selectedEntry?.def
  const selectedOwned = selectedEntry?.owned
  const upgradeLevel = selectedOwned?.upgradeLevel || 0
  const upgradeCost = selectedDef?.upgradeCost?.[upgradeLevel]
  const canUpgrade = upgradeLevel < 3 && upgradeCost && profile.coins >= upgradeCost

  const handleUpgrade = () => {
    if (!selected || !canUpgrade) return
    upgradeCard(selected)
  }

  return (
    <div className="players-screen">
      <div className="players-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <h1 className="players-title">Zawodnicy</h1>
        <div className="players-coins">🪙 {profile.coins}</div>
      </div>

      {/* Filter tabs */}
      <div className="players-filter">
        {['all', 'attack', 'midfield', 'defense', 'goalkeeper'].map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'filter-tab--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Wszyscy' : f === 'attack' ? '⚔️ ATK' : f === 'midfield' ? '🔄 MID' : f === 'defense' ? '🛡️ DEF' : '🥅 GK'}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div className="players-grid">
        {displayCards.map(({ owned, card }) => (
          <div
            key={owned.instanceId}
            className={`player-grid-item ${selected === owned.instanceId ? 'player-grid-item--selected' : ''}`}
            onClick={() => setSelected(prev => prev === owned.instanceId ? null : owned.instanceId)}
          >
            <PlayerCard card={card} size="small" />
            {owned.upgradeLevel > 0 && (
              <div className="upgrade-pip">+{owned.upgradeLevel}</div>
            )}
            {owned.isStarter && (
              <div className="starter-pip">S</div>
            )}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selectedCard && selectedDef && (
        <div className="players-detail">
          <div className="players-detail-card">
            <PlayerCard card={selectedCard} size="normal" />
          </div>
          <div className="players-detail-info">
            <div className="detail-name">{selectedCard.name}</div>
            <div className="detail-type">{selectedCard.typeLabel} · {selectedCard.rarity || 'starter'}</div>
            <div className="detail-stats">
              <span>⚔️ {selectedCard.currentAttackStat}</span>
              <span>🛡️ {selectedCard.currentDefenseStat}</span>
              <span>+{selectedOwned?.upgradeLevel ?? 0}/3 lvl</span>
            </div>
            {upgradeLevel < 3 ? (
              <button
                className={`upgrade-btn ${!canUpgrade ? 'upgrade-btn--disabled' : ''}`}
                onClick={handleUpgrade}
                disabled={!canUpgrade}
              >
                ⬆️ Ulepsz ({upgradeCost ?? '—'} 🪙)
              </button>
            ) : (
              <div className="upgrade-maxed">✅ Maksymalny poziom</div>
            )}
            {selectedOwned?.isStarter && (
              <div className="detail-starter-note">Karta startowa · Nie można sprzedać</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
