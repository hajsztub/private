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
  // Reserve bench (optional, any outfield type)
  { id: 'res1', type: 'reserve',    pos: 'RES', row: 4 },
  { id: 'res2', type: 'reserve',    pos: 'RES', row: 4 },
  { id: 'res3', type: 'reserve',    pos: 'RES', row: 4 },
]

const MAIN_SLOTS = FORMATION.filter(s => s.type !== 'reserve')
const RESERVE_SLOTS = FORMATION.filter(s => s.type === 'reserve')

// Which card types each slot accepts
const SLOT_ACCEPTS = {
  attack:     ['attack', 'midfield'],
  midfield:   ['midfield', 'attack', 'defense'],
  defense:    ['defense', 'midfield'],
  goalkeeper: ['goalkeeper'],
  reserve:    ['attack', 'midfield', 'defense', 'goalkeeper'],
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
const TYPE_COLOR_RESERVE = '#546e7a'

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

function initAssignments(allCards, activeDeck, savedAssignments) {
  const result = {}
  FORMATION.forEach(s => { result[s.id] = null })

  // Use saved layout if available, just validate cards still exist
  if (savedAssignments) {
    const ownedIds = new Set(allCards.map(({ owned }) => owned.instanceId))
    for (const slot of FORMATION) {
      const id = savedAssignments[slot.id]
      result[slot.id] = id && ownedIds.has(id) ? id : null
    }
    return result
  }

  if (!activeDeck?.length) return result

  const deckSet = new Set(activeDeck)
  const queues = { attack: [], midfield: [], defense: [], goalkeeper: [], reserve: [] }
  const assigned = new Set()

  for (const { owned, card } of allCards) {
    if (deckSet.has(owned.instanceId) && queues[card.type]) {
      queues[card.type].push(owned.instanceId)
    }
  }
  for (const slot of MAIN_SLOTS) {
    const q = queues[slot.type]
    if (q?.length) { result[slot.id] = q.shift(); assigned.add(result[slot.id]) }
  }
  for (const { owned } of allCards) {
    if (deckSet.has(owned.instanceId) && !assigned.has(owned.instanceId)) {
      queues.reserve.push(owned.instanceId)
    }
  }
  for (const slot of RESERVE_SLOTS) {
    if (queues.reserve.length) result[slot.id] = queues.reserve.shift()
  }
  return result
}

// ── Card Info Modal ────────────────────────────────────────────────────────

function CardInfoModal({ card, onClose }) {
  if (!card) return null
  const RARITY_C = { common: '#9e9e9e', rare: '#ff9800', legendary: '#ffd700', starter: '#607d8b' }
  const isPrimAtk = card.type === 'attack' || card.type === 'midfield-atk-first'
  return (
    <div className="ci-overlay" onClick={onClose}>
      <div className="ci-panel" onClick={e => e.stopPropagation()}>
        <button className="ci-close" onClick={onClose}>✕</button>
        <div className="ci-name">{card.name}</div>
        <div className="ci-meta">
          <span className="ci-type">{card.type}</span>
          <span className="ci-rarity" style={{ color: RARITY_C[card.rarity] }}>
            {card.rarity === 'legendary' ? '★★★' : card.rarity === 'rare' ? '★★' : '★'} {card.rarity}
          </span>
        </div>
        <div className="ci-stats">
          <div className="ci-stat"><span className="ci-slbl">ATK</span><span className="ci-sval ci-sval--atk">{card.currentAttackStat ?? card.attackStat ?? 0}</span></div>
          <div className="ci-stat"><span className="ci-slbl">DEF</span><span className="ci-sval ci-sval--def">{card.currentDefenseStat ?? card.defenseStat ?? 0}</span></div>
        </div>
        {card.abilityName && (
          <div className="ci-ability">
            <div className="ci-ability-name">{card.abilityName}</div>
            {card.abilityDescription && <div className="ci-ability-desc">{card.abilityDescription}</div>}
          </div>
        )}
        {card.noActivationDescription && (
          <div className="ci-noact">
            <span className="ci-noact-lbl">Brak aktywacji:</span> {card.noActivationDescription}
          </div>
        )}
        {card.upgradeStatBonus && (
          <div className="ci-upgrade-info">
            Ulepszenie: +{card.upgradeStatBonus} do {isPrimAtk ? 'ATK' : 'DEF'}
          </div>
        )}
      </div>
    </div>
  )
}

function injuryTimeLeft(until) {
  const ms = until - Date.now()
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function DeckBuilderScreen() {
  const { goBack } = useRouter()
  const { profile, setActiveDeck } = useProfile()
  const injuries = profile.injuries || {}
  const [notification, setNotification] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [manualFilter, setManualFilter] = useState('all')
  const [infoCard, setInfoCard] = useState(null)
  const [collectionSort, setCollectionSort] = useState(null) // null | 'atk' | 'def'

  const allCards = useMemo(() =>
    profile.ownedCards.map(o => {
      const def = ALL_DEFS.find(d => d.id === o.cardId)
      if (!def) return null
      return { owned: o, card: buildCard(o, def) }
    }).filter(Boolean)
  , [profile.ownedCards])

  const [assignments, setAssignments] = useState(() =>
    initAssignments(allCards, profile.activeDeck, profile.deckAssignments)
  )

  const assignedIds = useMemo(
    () => new Set(Object.values(assignments).filter(Boolean)),
    [assignments]
  )
  const mainFilledCount = useMemo(
    () => MAIN_SLOTS.filter(s => assignments[s.id]).length,
    [assignments]
  )
  const reserveFilledCount = useMemo(
    () => RESERVE_SLOTS.filter(s => assignments[s.id]).length,
    [assignments]
  )
  const totalFilledCount = mainFilledCount + reserveFilledCount
  const filledCount = assignedIds.size

  const showNotif = (msg, ok) => {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 2500)
  }

  const activeSlot = selectedSlot ? FORMATION.find(s => s.id === selectedSlot) : null
  const filterType = activeSlot ? activeSlot.type : manualFilter

  const filteredCards = useMemo(() => {
    let cards = allCards.filter(({ card }) =>
      (FILTER_ACCEPTS[filterType] ?? FILTER_ACCEPTS.all).includes(card.type)
    )
    if (collectionSort === 'atk') {
      cards = [...cards].sort((a, b) =>
        (b.card.currentAttackStat ?? b.card.attackStat ?? 0) -
        (a.card.currentAttackStat ?? a.card.attackStat ?? 0)
      )
    } else if (collectionSort === 'def') {
      cards = [...cards].sort((a, b) =>
        (b.card.currentDefenseStat ?? b.card.defenseStat ?? 0) -
        (a.card.currentDefenseStat ?? a.card.defenseStat ?? 0)
      )
    }
    return cards
  }, [allCards, filterType, collectionSort])

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

    // Block injured cards
    const injuredUntil = injuries[instanceId]
    if (injuredUntil && injuredUntil > Date.now()) {
      showNotif(`${card.name} jest kontuzjowany! (${injuryTimeLeft(injuredUntil)})`, false)
      return
    }

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
    setActiveDeck(ids, { ...assignments })
    showNotif('Skład zapisany! ✓', true)
  }

  const clearDeck = () => {
    const empty = {}
    FORMATION.forEach(s => { empty[s.id] = null })
    setAssignments(empty)
    showNotif('Skład wyczyszczony', true)
  }

  const autoFill = () => {
    // Score a card for a given slot type — higher = better fit
    const scoreFor = (card, slotType) => {
      const atk = card.currentAttackStat ?? card.attackStat ?? 0
      const def = card.currentDefenseStat ?? card.defenseStat ?? 0
      switch (slotType) {
        case 'goalkeeper': return def * 3
        case 'defense':    return def * 2 + atk
        case 'midfield':   return atk + def
        case 'attack':     return atk * 2 + def
        default:           return atk + def   // reserve
      }
    }

    // Build full card objects (with upgrade bonuses) for scoring
    const cardMap = new Map(allCards.map(({ owned, card }) => [owned.instanceId, card]))

    const next = {}
    FORMATION.forEach(s => { next[s.id] = null })
    const usedIds = new Set()

    const fillSlots = (slots) => {
      for (const slot of slots) {
        const accepts = SLOT_ACCEPTS[slot.type]
        // Collect candidates: right type, not yet used, no duplicate card id
        const candidates = allCards
          .filter(({ owned, card }) => {
            if (usedIds.has(owned.instanceId)) return false
            if (!accepts.includes(card.type)) return false
            // Disallow same card id already placed in another slot
            const alreadyPlaced = Object.values(next).some(id => {
              if (!id) return false
              const c = cardMap.get(id)
              return c?.id === card.id
            })
            return !alreadyPlaced
          })
          .sort((a, b) => scoreFor(b.card, slot.type) - scoreFor(a.card, slot.type))

        const pick = candidates[0]
        if (pick) {
          next[slot.id] = pick.owned.instanceId
          usedIds.add(pick.owned.instanceId)
        }
      }
    }

    // Fill main slots first (priority order: GK → DEF → MID → ATK), then reserve
    const ordered = [
      ...MAIN_SLOTS.filter(s => s.type === 'goalkeeper'),
      ...MAIN_SLOTS.filter(s => s.type === 'defense'),
      ...MAIN_SLOTS.filter(s => s.type === 'midfield'),
      ...MAIN_SLOTS.filter(s => s.type === 'attack'),
    ]
    fillSlots(ordered)
    fillSlots(RESERVE_SLOTS)

    setAssignments(next)
    const totalFilled = FORMATION.filter(s => next[s.id]).length
    showNotif(`Skład uzupełniony (${totalFilled}/14)`, true)
  }

  const formationRows = ROWS.map(r => FORMATION.filter(s => s.row === r))

  return (
    <div className="deckbuilder">

      {/* Header */}
      <div className="db-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <h1 className="db-title">Ustaw Skład</h1>
        <div className={`db-count ${totalFilledCount === 14 ? 'db-count--full' : ''}`}>
          {totalFilledCount}<span className="db-count-total">/14</span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="db-body">

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
                  onInfo={card ? (e) => { e.stopPropagation(); setInfoCard(card) } : null}
                />
              )
            })}
          </div>
        ))}
        <div className="db-pitch-label db-pitch-label--bot">GK</div>
      </div>

      {/* Reserve bench */}
      <div className="db-reserve">
        <span className="db-reserve-label">REZERWA</span>
        <div className="db-reserve-slots">
          {RESERVE_SLOTS.map(slot => {
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
                onInfo={card ? (e) => { e.stopPropagation(); setInfoCard(card) } : null}
              />
            )
          })}
        </div>
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

      {/* Sort buttons */}
      <div className="db-sort-row">
        <span className="db-sort-label">Sortuj:</span>
        <button
          className={`db-sort-btn ${collectionSort === 'atk' ? 'db-sort-btn--active' : ''}`}
          onClick={() => setCollectionSort(s => s === 'atk' ? null : 'atk')}
        >⚔ ATK</button>
        <button
          className={`db-sort-btn ${collectionSort === 'def' ? 'db-sort-btn--active' : ''}`}
          onClick={() => setCollectionSort(s => s === 'def' ? null : 'def')}
        >🛡 DEF</button>
      </div>

      {/* Card picker list */}
      <div className="db-picker">
        {filteredCards.map(({ owned, card }) => {
          const isAssigned = assignedIds.has(owned.instanceId)
          const slotLabel = isAssigned
            ? FORMATION.find(s => assignments[s.id] === owned.instanceId)?.pos
            : null
          const injuredUntil = injuries[owned.instanceId]
          const isInjured = injuredUntil && injuredUntil > Date.now()
          return (
            <CardPickerRow
              key={owned.instanceId}
              card={card}
              assigned={isAssigned}
              slotLabel={slotLabel}
              hasDuplicate={profile.ownedCards.filter(o => o.cardId === card.id).length > 1}
              injured={isInjured}
              injuryLeft={isInjured ? injuryTimeLeft(injuredUntil) : null}
              onClick={() => handleCardPick(owned.instanceId)}
            />
          )
        })}
        {filteredCards.length === 0 && (
          <div className="db-empty">Brak kart dla tej pozycji</div>
        )}
      </div>

      </div>{/* end db-body */}

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
          Zapisz Skład ({totalFilledCount}/14)
        </button>
      </div>

      {notification && (
        <div className={`db-notif ${notification.ok ? 'db-notif--ok' : 'db-notif--err'}`}>
          {notification.msg}
        </div>
      )}

      {infoCard && <CardInfoModal card={infoCard} onClose={() => setInfoCard(null)} />}
    </div>
  )
}

// ── Formation slot ─────────────────────────────────────────────────────────

function FormationSlot({ slot, card, selected, onClick, onInfo }) {
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
          {onInfo && (
            <button className="fs-info-btn" onClick={onInfo} title="Info">ⓘ</button>
          )}
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

function CardPickerRow({ card, assigned, slotLabel, hasDuplicate, injured, injuryLeft, onClick }) {
  const [imgFailed, setImgFailed] = React.useState(false)
  const atk = card.currentAttackStat ?? card.attackStat ?? 0
  const def = card.currentDefenseStat ?? card.defenseStat ?? 0
  const RARITY_C = { common: '#9e9e9e', rare: '#ff9800', legendary: '#ffd700', starter: '#607d8b' }

  return (
    <div className={`cp-row ${assigned ? 'cp-row--assigned' : ''} ${hasDuplicate ? 'cp-row--duplicate' : ''} ${injured ? 'cp-row--injured' : ''}`} onClick={onClick}>
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
          {injured && <span className="cp-injury-badge">🩹 {injuryLeft}</span>}
        </div>
      </div>
      <div className={`cp-badge ${assigned ? 'cp-badge--on' : ''}`}>
        {injured ? '🩹' : assigned ? slotLabel : '+'}
      </div>
    </div>
  )
}
