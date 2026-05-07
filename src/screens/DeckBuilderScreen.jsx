import React, { useState } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import PlayerCard from '../components/PlayerCard'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import './DeckBuilderScreen.css'

const ALL_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

// Required deck composition: 2 GK, 3 DEF, 3 MID/ATK, 3 FLD = 11 total
// Simplified: player picks any 11 (with at least 2 GK)
const DECK_SIZE = 11
const MIN_GK = 2

function buildCard(owned, def) {
  const bonus = (owned.upgradeLevel || 0) * (def.upgradeStatBonus || 1)
  return {
    ...def,
    instanceId: owned.instanceId,
    currentAttackStat: def.attackStat + bonus,
    currentDefenseStat: def.defenseStat + bonus,
    upgradeLevel: owned.upgradeLevel || 0,
    isStarter: owned.isStarter,
  }
}

export default function DeckBuilderScreen() {
  const { goBack } = useRouter()
  const { profile, setActiveDeck } = useProfile()
  const [selectedIds, setSelectedIds] = useState(new Set(profile.activeDeck || []))
  const [notification, setNotification] = useState(null)

  const showNotif = (msg, ok) => {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 2500)
  }

  const deckCards = profile.ownedCards.map(o => {
    const def = ALL_DEFS.find(d => d.id === o.cardId)
    if (!def) return null
    return { owned: o, def, card: buildCard(o, def) }
  }).filter(Boolean)

  const toggleCard = (instanceId, cardType) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(instanceId)) {
        next.delete(instanceId)
        return next
      }
      if (next.size >= DECK_SIZE) {
        showNotif(`Talia może mieć max ${DECK_SIZE} kart!`, false)
        return prev
      }
      next.add(instanceId)
      return next
    })
  }

  const saveDeck = () => {
    const selected = profile.ownedCards.filter(o => selectedIds.has(o.instanceId))
    const gkCount = selected.filter(o => {
      const def = ALL_DEFS.find(d => d.id === o.cardId)
      return def?.type === 'goalkeeper'
    }).length
    if (gkCount < MIN_GK) {
      showNotif(`Musisz mieć minimum ${MIN_GK} bramkarzy!`, false)
      return
    }
    if (selected.length < 4) {
      showNotif('Za mało kart w talii (min. 4)!', false)
      return
    }
    setActiveDeck([...selectedIds])
    showNotif('Talia zapisana!', true)
  }

  const selectedCount = selectedIds.size
  const gkSelected = profile.ownedCards.filter(o => {
    if (!selectedIds.has(o.instanceId)) return false
    const def = ALL_DEFS.find(d => d.id === o.cardId)
    return def?.type === 'goalkeeper'
  }).length

  return (
    <div className="deckbuilder-screen">
      <div className="db-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <h1 className="db-title">Utwórz Zespół</h1>
        <div className="db-count">
          <span className={selectedCount >= DECK_SIZE ? 'db-count-full' : ''}>{selectedCount}/{DECK_SIZE}</span>
        </div>
      </div>

      {/* Composition info */}
      <div className="db-info-bar">
        <div className={`db-req ${gkSelected >= MIN_GK ? 'db-req--ok' : ''}`}>
          🥅 Bramkarze: {gkSelected}/{MIN_GK}
        </div>
        <div className="db-req">
          ⚽ Łącznie: {selectedCount}/{DECK_SIZE}
        </div>
      </div>

      {/* Cards */}
      <div className="db-grid">
        {deckCards.map(({ owned, card }) => {
          const inDeck = selectedIds.has(owned.instanceId)
          return (
            <div
              key={owned.instanceId}
              className={`db-card-item ${inDeck ? 'db-card-item--selected' : ''}`}
              onClick={() => toggleCard(owned.instanceId, card.type)}
            >
              <PlayerCard card={card} size="small" />
              {inDeck && <div className="db-checkmark">✓</div>}
              {owned.upgradeLevel > 0 && <div className="db-upgrade-pip">+{owned.upgradeLevel}</div>}
            </div>
          )
        })}
      </div>

      <div className="db-footer">
        <button className="db-save-btn" onClick={saveDeck}>
          💾 Zapisz Talię
        </button>
      </div>

      {notification && (
        <div className={`db-notif ${notification.ok ? 'db-notif--ok' : 'db-notif--err'}`}>
          {notification.msg}
        </div>
      )}
    </div>
  )
}
