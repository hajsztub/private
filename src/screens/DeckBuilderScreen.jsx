import React, { useState, useMemo } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import './DeckBuilderScreen.css'

const ALL_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

const FORMATION = [
  { id: 'atk1', type: 'attack',     pos: 'ATK', row: 0 },
  { id: 'atk2', type: 'attack',     pos: 'ATK', row: 0 },
  { id: 'mid1', type: 'midfield',   pos: 'MID', row: 1 },
  { id: 'mid2', type: 'midfield',   pos: 'MID', row: 1 },
  { id: 'mid3', type: 'midfield',   pos: 'MID', row: 1 },
  { id: 'mid4', type: 'midfield',   pos: 'MID', row: 1 },
  { id: 'def1', type: 'defense',    pos: 'DEF', row: 2 },
  { id: 'def2', type: 'defense',    pos: 'DEF', row: 2 },
  { id: 'def3', type: 'defense',    pos: 'DEF', row: 2 },
  { id: 'def4', type: 'defense',    pos: 'DEF', row: 2 },
  { id: 'gk1',  type: 'goalkeeper', pos: 'GK',  row: 3 },
]

// Which card types each slot accepts
const SLOT_ACCEPTS = {
  attack:     ['attack', 'midfield'],
  midfield:   ['midfield', 'attack', 'defense'],
  defense:    ['defense', 'midfield'],
  goalkeeper: ['goalkeeper'],
}

const FILTER_ACCEPTS = {
  all:        ['attack', 'midfield', 'defense', 'goalkeeper'],
  attack:     ['attack', 'midfield'],
  midfield:   ['midfield'],
  defense:    ['defense', 'midfield'],
  goalkeeper: ['goalkeeper'],
}

const TYPE_COLOR = {
  attack: '#ff5252', midfield: '#aa40ff', defense: '#448aff', goalkeeper: '#00b0ff',
}

const ROWS = [0, 1, 2, 3]

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

function initAssignments(allCards, activeDeck) {
  const result = {}
  FORMATION.forEach(s => { result[s.id] = null })
  if (!activeDeck?.length) return result

  const deckSet = new Set(activeDeck)
  const queues = { attack: [], midfield: [], defense: [], goalkeeper: [] }

  for (const { owned, card } of allCards) {
    if (deckSet.has(owned.instanceId) && queues[card.type]) {
      queues[card.type].push(owned.instanceId)
    }
  }
  for (const slot of FORMATION) {
    const q = queues[slot.type]
    if (q?.length) result[slot.id] = q.shift()
  }
  return result
}

export default function DeckBuilderScreen() {
  const { goBack } = useRouter()
  const { profile, setActiveDeck } = useProfile()
  const [notification, setNotification] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [manualFilter, setManualFilter] = useState('all')

  const allCards = useMemo(() =>
    profile.ownedCards.map(o => {
      const def = ALL_DEFS.find(d => d.id === o.cardId)
      if (!def) return null
      return { owned: o, card: buildCard(o, def) }
    }).filter(Boolean)
  , [profile.ownedCards])

  const [assignments, setAssignments] = useState(() =>
    initAssignments(allCards, profile.activeDeck)
  )

  const assignedIds = useMemo(
    () => new Set(Object.values(assignments).filter(Boolean)),
    [assignments]
  )
  const filledCount = assignedIds.size

  const showNotif = (msg, ok) => {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 2500)
  }

  const activeSlot = selectedSlot ? FORMATION.find(s => s.id === selectedSlot) : null
  const filterType = activeSlot ? activeSlot.type : manualFilter

  const filteredCards = allCards.filter(({ card }) =>
    (FILTER_ACCEPTS[filterType] ?? FILTER_ACCEPTS.all).includes(card.type)
  )

  const handleSlotClick = (slotId) => {
    if (selectedSlot === slotId) {
      setSelectedSlot(null)
      return
    }
    if (assignments[slotId]) {
      // Tap occupied slot → deselect card from it
      setAssignments(prev => ({ ...prev, [slotId]: null }))
      setSelectedSlot(slotId)
    } else {
      setSelectedSlot(slotId)
    }
  }

  const handleCardPick = (instanceId) => {
    const entry = allCards.find(({ owned }) => owned.instanceId === instanceId)
    if (!entry) return
    const { card } = entry

    // Prevent duplicate cardId in deck
    const alreadyInDeck = Object.values(assignments).some(id => {
      if (!id || id === instanceId) return false
      const entry2 = allCards.find(({ owned }) => owned.instanceId === id)
      return entry2?.card?.id === card.id
    })
    if (alreadyInDeck) {
      showNotif(`${card.name} już jest w składzie!`, false)
      return
    }

    if (selectedSlot) {
      const slot = FORMATION.find(s => s.id === selectedSlot)
      if (!SLOT_ACCEPTS[slot.type].includes(card.type)) {
        showNotif(`${card.name} nie pasuje do pozycji ${slot.pos}!`, false)
        return
      }
      setAssignments(prev => {
        const next = { ...prev }
        for (const k of Object.keys(next)) {
          if (next[k] === instanceId) next[k] = null
        }
        next[selectedSlot] = instanceId
        return next
      })
      // Advance to next empty slot of same type
      const sameType = FORMATION.filter(s => s.type === slot.type && s.id !== selectedSlot)
      const next = sameType.find(s => !assignments[s.id])
      if (next) {
        setSelectedSlot(next.id)
      } else {
        setSelectedSlot(null)
        setManualFilter('all')
      }
    } else {
      // Auto-assign to first compatible empty slot
      // If already in deck (same instance), do nothing
      if (assignedIds.has(instanceId)) {
        showNotif(`${card.name} już jest w składzie!`, false)
        return
      }
      const compatible = FORMATION.filter(s =>
        SLOT_ACCEPTS[s.type].includes(card.type) && !assignments[s.id]
      )
      if (!compatible.length) {
        showNotif('Brak wolnego miejsca dla tej pozycji!', false)
        return
      }
      setAssignments(prev => ({ ...prev, [compatible[0].id]: instanceId }))
    }
  }

  const saveDeck = () => {
    const ids = Object.values(assignments).filter(Boolean)
    const gkCount = ids.filter(id => {
      const c = allCards.find(({ owned }) => owned.instanceId === id)?.card
      return c?.type === 'goalkeeper'
    }).length
    if (gkCount < 1) { showNotif('Wymagany co najmniej 1 bramkarz!', false); return }
    if (ids.length < 4) { showNotif('Za mało kart (min. 4)!', false); return }
    setActiveDeck(ids)
    showNotif('Skład zapisany! ✓', true)
  }

  const clearDeck = () => {
    const empty = {}
    FORMATION.forEach(s => { empty[s.id] = null })
    setAssignments(empty)
    showNotif('Skład wyczyszczony', true)
  }

  const autoFill = () => {
    const usedIds = new Set(Object.values(assignments).filter(Boolean))
    const next = { ...assignments }

    for (const slot of FORMATION) {
      if (next[slot.id]) continue // already filled
      const accepts = SLOT_ACCEPTS[slot.type]
      // Find first unassigned card that fits and isn't already a duplicate id in deck
      const pick = allCards.find(({ owned, card }) => {
        if (usedIds.has(owned.instanceId)) return false
        if (!accepts.includes(card.type)) return false
        // No duplicate card definitions in deck
        const alreadyUsed = Object.values(next).some(id => {
          if (!id) return false
          const entry = allCards.find(e => e.owned.instanceId === id)
          return entry?.card?.id === card.id
        })
        return !alreadyUsed
      })
      if (pick) {
        next[slot.id] = pick.owned.instanceId
        usedIds.add(pick.owned.instanceId)
      }
    }
    setAssignments(next)
    const filled = Object.values(next).filter(Boolean).length
    showNotif(`Skład uzupełniony (${filled}/11)`, true)
  }

  const formationRows = ROWS.map(r => FORMATION.filter(s => s.row === r))

  return (
    <div className="deckbuilder">

      {/* Header */}
      <div className="db-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <h1 className="db-title">Ustaw Skład</h1>
        <div className={`db-count ${filledCount === 11 ? 'db-count--full' : ''}`}>
          {filledCount}<span className="db-count-total">/11</span>
        </div>
      </div>

      {/* Formation pitch */}
      <div className="db-pitch">
        <div className="db-pitch-label db-pitch-label--top">ATK</div>
        {formationRows.map((row, ri) => (
          <div key={ri} className="db-row">
            {row.map(slot => {
              const card = assignments[slot.id]
                ? allCards.find(({ owned }) => owned.instanceId === assignments[slot.id])?.card
                : null
              return (
                <FormationSlot
                  key={slot.id}
                  slot={slot}
                  card={card}
                  selected={selectedSlot === slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                />
              )
            })}
          </div>
        ))}
        <div className="db-pitch-label db-pitch-label--bot">GK</div>
      </div>

      {/* Filter tabs */}
      <div className="db-filter-row">
        {['all', 'attack', 'midfield', 'defense', 'goalkeeper'].map(f => (
          <button
            key={f}
            className={`db-filter-tab ${filterType === f || (f === 'all' && !activeSlot && manualFilter === 'all') ? 'db-filter-tab--active' : ''}`}
            onClick={() => { setManualFilter(f); setSelectedSlot(null) }}
          >
            {f === 'all' ? 'Wszyscy' : f === 'attack' ? '⚔' : f === 'midfield' ? '🔮' : f === 'defense' ? '🛡' : '🥅'}
          </button>
        ))}
      </div>

      {/* Picker hint */}
      {activeSlot && (
        <div className="db-slot-hint">
          <span>Wybierz kartę dla pozycji</span>
          <span className="db-hint-pos" style={{ color: TYPE_COLOR[activeSlot.type] }}>
            {activeSlot.pos}
          </span>
          <button className="db-hint-cancel" onClick={() => { setSelectedSlot(null); setManualFilter('all') }}>✕</button>
        </div>
      )}

      {/* Card picker list */}
      <div className="db-picker">
        {filteredCards.map(({ owned, card }) => {
          const isAssigned = assignedIds.has(owned.instanceId)
          const slotLabel = isAssigned
            ? FORMATION.find(s => assignments[s.id] === owned.instanceId)?.pos
            : null
          return (
            <CardPickerRow
              key={owned.instanceId}
              card={card}
              assigned={isAssigned}
              slotLabel={slotLabel}
              hasDuplicate={profile.ownedCards.filter(o => o.cardId === card.id).length > 1}
              onClick={() => handleCardPick(owned.instanceId)}
            />
          )
        })}
        {filteredCards.length === 0 && (
          <div className="db-empty">Brak kart dla tej pozycji</div>
        )}
      </div>

      {/* Footer */}
      <div className="db-footer">
        <div className="db-footer-row">
          <button className="db-auto-btn" onClick={autoFill} title="Uzupełnij skład automatycznie">
            ⚡ AUTO
          </button>
          <button className="db-clear-btn" onClick={clearDeck} title="Wyczyść skład">
            🗑 WYCZYŚĆ
          </button>
        </div>
        <button className="db-save-btn" onClick={saveDeck}>
          Zapisz Skład ({filledCount}/11)
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

// ── Formation slot ─────────────────────────────────────────────────────────

function FormationSlot({ slot, card, selected, onClick }) {
  const [imgFailed, setImgFailed] = React.useState(false)
  return (
    <div
      className={`fs-slot ${selected ? 'fs-slot--selected' : ''} ${card ? 'fs-slot--filled' : 'fs-slot--empty'}`}
      style={{ '--slot-c': TYPE_COLOR[slot.type] }}
      onClick={onClick}
    >
      {card ? (
        <>
          {!imgFailed ? (
            <img
              className="fs-slot-img"
              src={`/avatars/${card.id}.png`}
              alt=""
              onError={() => setImgFailed(true)}
              draggable={false}
            />
          ) : (
            <div className="fs-slot-fallback">{(card.name || '?')[0]}</div>
          )}
          <div className="fs-slot-name">{card.name.split(' ')[0]}</div>
        </>
      ) : (
        <div className="fs-slot-empty-inner">
          <span className="fs-slot-pos">{slot.pos}</span>
          <span className="fs-slot-plus">+</span>
        </div>
      )}
    </div>
  )
}

// ── Card picker row ────────────────────────────────────────────────────────

function CardPickerRow({ card, assigned, slotLabel, hasDuplicate, onClick }) {
  const [imgFailed, setImgFailed] = React.useState(false)
  const atk = card.currentAttackStat ?? card.attackStat ?? 0
  const def = card.currentDefenseStat ?? card.defenseStat ?? 0
  const RARITY_C = { common: '#9e9e9e', rare: '#ff9800', legendary: '#ffd700', starter: '#607d8b' }

  return (
    <div className={`cp-row ${assigned ? 'cp-row--assigned' : ''} ${hasDuplicate ? 'cp-row--duplicate' : ''}`} onClick={onClick}>
      <div className="cp-avatar">
        {!imgFailed ? (
          <img
            className="cp-avatar-img"
            src={`/avatars/${card.id}.png`}
            alt=""
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          <div className="cp-avatar-fallback">{(card.name || '?')[0]}</div>
        )}
      </div>
      <div className="cp-info">
        <div className="cp-header">
          <span className="cp-type-badge" style={{ background: TYPE_COLOR[card.type] }}>
            {card.typeLabel || card.type.slice(0, 3).toUpperCase()}
          </span>
          <span className="cp-name">{card.name}</span>
          {card.upgradeLevel > 0 && (
            <span className="cp-upgrade">+{card.upgradeLevel}</span>
          )}
        </div>
        <div className="cp-stats">
          <span className="cp-atk">⚔ {atk}</span>
          <span className="cp-def">🛡 {def}</span>
          <span className="cp-rarity" style={{ color: RARITY_C[card.rarity] }}>
            {card.rarity === 'legendary' ? '★★★' : card.rarity === 'rare' ? '★★' : '★'}
          </span>
          {hasDuplicate && <span className="cp-dup-badge" title="Masz duplikat - możliwy upgrade">🔄</span>}
        </div>
      </div>
      <div className={`cp-badge ${assigned ? 'cp-badge--on' : ''}`}>
        {assigned ? slotLabel : '+'}
      </div>
    </div>
  )
}
