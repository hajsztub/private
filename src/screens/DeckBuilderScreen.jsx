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
  { id: 'res1', type: 'reserve',    pos: 'RES', row: 4 },
  { id: 'res2', type: 'reserve',    pos: 'RES', row: 4 },
  { id: 'res3', type: 'reserve',    pos: 'RES', row: 4 },
]

const MAIN_SLOTS = FORMATION.filter(s => s.type !== 'reserve')
const RESERVE_SLOTS = FORMATION.filter(s => s.type === 'reserve')

const SLOT_ACCEPTS = {
  attack:     ['attack', 'midfield'],
  midfield:   ['midfield', 'attack'],
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
  attack: '#ff5252', midfield: '#aa40ff', defense: '#448aff', goalkeeper: '#00c853',
}

const ROWS = [0, 1, 2, 3]

function buildCard(owned, def) {
  const level = owned.upgradeLevel || 0
  const bonus = level * (def.upgradeStatBonus || 1)
  const maxBonus = level >= 3 ? (def.maxLevelBonus ?? (def.rarity === 'legendary' ? 5 : 3)) : 0
  const isPrimAtk = def.type === 'attack' || (def.type === 'midfield' && def.attackStat >= def.defenseStat)
  const isDefOrGK = !isPrimAtk || def.type === 'goalkeeper' || def.type === 'defense'
  return {
    ...def,
    instanceId: owned.instanceId,
    currentAttackStat: def.attackStat + (isPrimAtk ? bonus + maxBonus : 0),
    currentDefenseStat: def.defenseStat + (isDefOrGK ? bonus + maxBonus : 0),
    upgradeLevel: level,
    isStarter: owned.isStarter,
  }
}

function initAssignments(allCards, activeDeck, savedAssignments, injuries) {
  const result = {}
  FORMATION.forEach(s => { result[s.id] = null })
  const now = Date.now()
  const isInjured = (id) => injuries && id && injuries[id] && injuries[id] > now

  if (savedAssignments) {
    const ownedIds = new Set(allCards.map(({ owned }) => owned.instanceId))
    for (const slot of FORMATION) {
      const id = savedAssignments[slot.id]
      result[slot.id] = id && ownedIds.has(id) && !isInjured(id) ? id : null
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
  const [collectionSort, setCollectionSort] = useState('atk')

  const allCards = useMemo(() =>
    profile.ownedCards.map(o => {
      const def = ALL_DEFS.find(d => d.id === o.cardId)
      if (!def) return null
      return { owned: o, card: buildCard(o, def) }
    }).filter(Boolean)
  , [profile.ownedCards])

  const [assignments, setAssignments] = useState(() =>
    initAssignments(allCards, profile.activeDeck, profile.deckAssignments, profile.injuries || {})
  )

  const assignedIds = useMemo(
    () => new Set(Object.values(assignments).filter(Boolean)),
    [assignments]
  )
  const totalFilledCount = useMemo(
    () => FORMATION.filter(s => assignments[s.id]).length,
    [assignments]
  )
  const filledCount = assignedIds.size

  const totalAtk = useMemo(() =>
    MAIN_SLOTS
      .filter(s => s.type === 'attack' || s.type === 'midfield')
      .reduce((sum, slot) => {
        const card = assignments[slot.id]
          ? allCards.find(({ owned }) => owned.instanceId === assignments[slot.id])?.card
          : null
        return sum + (card?.currentAttackStat ?? 0)
      }, 0)
  , [assignments, allCards])

  const totalDef = useMemo(() =>
    MAIN_SLOTS
      .filter(s => s.type === 'defense' || s.type === 'goalkeeper')
      .reduce((sum, slot) => {
        const card = assignments[slot.id]
          ? allCards.find(({ owned }) => owned.instanceId === assignments[slot.id])?.card
          : null
        return sum + (card?.currentDefenseStat ?? 0)
      }, 0)
  , [assignments, allCards])

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

    const injuredUntil = injuries[instanceId]
    if (injuredUntil && injuredUntil > Date.now()) {
      showNotif(`${card.name} jest kontuzjowany! (${injuryTimeLeft(injuredUntil)})`, false)
      return
    }

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
      const sameType = FORMATION.filter(s => s.type === slot.type && s.id !== selectedSlot)
      const next = sameType.find(s => !assignments[s.id])
      if (next) {
        setSelectedSlot(next.id)
      } else {
        setSelectedSlot(null)
        setManualFilter('all')
      }
    } else {
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
    const scoreFor = (card, slotType) => {
      const atk = card.currentAttackStat ?? card.attackStat ?? 0
      const def = card.currentDefenseStat ?? card.defenseStat ?? 0
      switch (slotType) {
        case 'goalkeeper': return def * 3
        case 'defense':    return def * 2 + atk
        case 'midfield':   return atk + def
        case 'attack':     return atk * 2 + def
        default:           return atk + def
      }
    }

    const cardMap = new Map(allCards.map(({ owned, card }) => [owned.instanceId, card]))
    const next = {}
    FORMATION.forEach(s => { next[s.id] = null })
    const usedIds = new Set()

    const fillSlots = (slots) => {
      for (const slot of slots) {
        const accepts = SLOT_ACCEPTS[slot.type]
        const candidates = allCards
          .filter(({ owned, card }) => {
            if (usedIds.has(owned.instanceId)) return false
            if (!accepts.includes(card.type)) return false
            const injuredUntil = injuries[owned.instanceId]
            if (injuredUntil && injuredUntil > Date.now()) return false
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

  const FILTERS = [
    { id: 'all',        label: 'WSZYSCY' },
    { id: 'attack',     label: '✕ ATK' },
    { id: 'midfield',   label: '○ MID' },
    { id: 'defense',    label: '○ DEF' },
    { id: 'goalkeeper', label: '🧤 GK' },
  ]

  return (
    <div className="deckbuilder">

      {/* Header */}
      <div className="db-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <h1 className="db-title">USTAW SKŁAD</h1>
        <div className="db-count-wrap">
          <div className={`db-count ${filledCount === 14 ? 'db-count--full' : ''}`}>{filledCount}/14</div>
          <div className="db-count-sub">ZAWODNIKÓW</div>
        </div>
      </div>

      <div className="db-body">

        {/* Stats bar */}
        <div className="db-stats-bar">
          <div className="dsb-block dsb-block--atk">
            <div className="dsb-icon dsb-icon--atk">✕</div>
            <div className="dsb-inner">
              <div className="dsb-label">ATAK</div>
              <div className="dsb-val">{totalAtk}</div>
            </div>
            <div className="dsb-segments">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`dsb-seg dsb-seg--atk ${totalAtk / 60 * 5 > i ? 'dsb-seg--on' : ''}`} />
              ))}
            </div>
          </div>
          <div className="dsb-block dsb-block--def">
            <div className="dsb-icon dsb-icon--def">🛡</div>
            <div className="dsb-inner">
              <div className="dsb-label">OBRONA</div>
              <div className="dsb-val">{totalDef}</div>
            </div>
            <div className="dsb-segments">
              {[0,1,2,3,4].map(i => (
                <div key={i} className={`dsb-seg dsb-seg--def ${totalDef / 60 * 5 > i ? 'dsb-seg--on' : ''}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Formation pitch */}
        <div className="db-pitch">
          <div className="db-formation-label">FORMACJA: 4-4-2</div>
          {formationRows.map((row, ri) => (
            <div key={ri} className="db-row">
              {row.map(slot => {
                const card = assignments[slot.id]
                  ? allCards.find(({ owned }) => owned.instanceId === assignments[slot.id])?.card
                  : null
                const slotInstanceId = assignments[slot.id]
                const isSlotInjured = slotInstanceId
                  ? !!(injuries[slotInstanceId] && injuries[slotInstanceId] > Date.now())
                  : false
                return (
                  <FormationSlot
                    key={slot.id}
                    slot={slot}
                    card={card}
                    selected={selectedSlot === slot.id}
                    injured={isSlotInjured}
                    onClick={() => handleSlotClick(slot.id)}
                    onInfo={card ? (e) => { e.stopPropagation(); setInfoCard(card) } : null}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Reserve bench */}
        <div className="db-reserve">
          <span className="db-reserve-label">REZERWA</span>
          <div className="db-reserve-slots">
            {RESERVE_SLOTS.map(slot => {
              const card = assignments[slot.id]
                ? allCards.find(({ owned }) => owned.instanceId === assignments[slot.id])?.card
                : null
              const slotInstanceId = assignments[slot.id]
              const isSlotInjured = slotInstanceId
                ? !!(injuries[slotInstanceId] && injuries[slotInstanceId] > Date.now())
                : false
              return (
                <FormationSlot
                  key={slot.id}
                  slot={slot}
                  card={card}
                  selected={selectedSlot === slot.id}
                  injured={isSlotInjured}
                  onClick={() => handleSlotClick(slot.id)}
                  onInfo={card ? (e) => { e.stopPropagation(); setInfoCard(card) } : null}
                />
              )
            })}
          </div>
          <div className="db-reserve-hint">
            ⓘ Pomocnicy liczeni są według wyższej wartości (ATAK lub OBRONA).
          </div>
        </div>

        {/* Filter tabs + sort */}
        <div className="db-filter-row">
          <div className="db-filter-tabs">
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={`db-filter-tab ${filterType === f.id || (f.id === 'all' && !activeSlot && manualFilter === 'all') ? 'db-filter-tab--active' : ''}`}
                onClick={() => { setManualFilter(f.id); setSelectedSlot(null) }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="db-sort-wrap">
            <span className="db-sort-label">SORTUJ:</span>
            <button
              className="db-sort-sel"
              onClick={() => setCollectionSort(s => s === 'atk' ? 'def' : 'atk')}
            >
              {collectionSort === 'def' ? 'DEF ↓' : 'ATK ↓'}
            </button>
          </div>
        </div>

        {/* Picker hint when slot selected */}
        {activeSlot && (
          <div className="db-slot-hint">
            <span>Wybierz kartę dla pozycji</span>
            <span className="db-hint-pos" style={{ color: TYPE_COLOR[activeSlot.type] }}>
              {activeSlot.pos}
            </span>
            <button className="db-hint-cancel" onClick={() => { setSelectedSlot(null); setManualFilter('all') }}>✕</button>
          </div>
        )}

        {/* 2-column card picker */}
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
          <button className="db-auto-btn" onClick={autoFill}>
            ⚡ AUTO UZUPEŁNIJ
          </button>
          <button className="db-clear-btn" onClick={clearDeck}>
            🗑 WYCZYŚĆ SKŁAD
          </button>
        </div>
        <button className="db-save-btn" onClick={saveDeck}>
          💾 ZAPISZ SKŁAD ({filledCount}/14)
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

function FormationSlot({ slot, card, selected, onClick, injured }) {
  const [imgFailed, setImgFailed] = React.useState(false)
  const atk = card ? (card.currentAttackStat ?? 0) : 0
  const def = card ? (card.currentDefenseStat ?? 0) : 0
  const mainStat = card
    ? ((slot.type === 'attack' || slot.type === 'midfield') ? atk : def)
    : null

  return (
    <div
      className={`fs-slot ${selected ? 'fs-slot--selected' : ''} ${card ? 'fs-slot--filled' : 'fs-slot--empty'} ${injured ? 'fs-slot--injured' : ''}`}
      style={{ '--slot-c': TYPE_COLOR[slot.type] }}
      onClick={onClick}
    >
      {card ? (
        <>
          <div className="fs-slot-topbar">
            <span className="fs-slot-typebadge">{slot.pos}</span>
            <span className="fs-slot-mainstat">{mainStat}</span>
          </div>
          <div className="fs-slot-avatar">
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
          </div>
          <div className="fs-slot-footer">
            <div className="fs-slot-name">{card.name.split(' ')[0]}</div>
            <div className="fs-slot-smallstats">
              <span className="fss-atk">★{atk}</span>
              <span className="fss-def">♥{def}</span>
            </div>
          </div>
          {injured && <div className="fs-slot-injury">🩹</div>}
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

  return (
    <div
      className={`cp-row ${assigned ? 'cp-row--assigned' : ''} ${hasDuplicate ? 'cp-row--duplicate' : ''} ${injured ? 'cp-row--injured' : ''}`}
      onClick={onClick}
    >
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
        <div className="cp-top">
          <span className="cp-type-badge" style={{ background: TYPE_COLOR[card.type] }}>
            {card.typeLabel || card.type.slice(0, 3).toUpperCase()}
          </span>
          {assigned && <span className="cp-assigned-tag">{slotLabel}</span>}
          {card.upgradeLevel > 0 && <span className="cp-upgrade">+{card.upgradeLevel}</span>}
        </div>
        <div className="cp-name">{card.name}</div>
        <div className="cp-stats">
          <span className="cp-atk">★ {atk}</span>
          <span className="cp-def">♥ {def}</span>
          {injured && <span className="cp-injury-badge">🩹 {injuryLeft}</span>}
        </div>
      </div>
      <div className={`cp-badge ${assigned ? 'cp-badge--on' : ''}`}>
        {injured ? '🩹' : assigned ? '✓' : '+'}
      </div>
    </div>
  )
}
