import React, { useState, useMemo } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import FieldCard from '../components/FieldCard'
import CurrencyBar from '../components/CurrencyBar'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import { SFX } from '../game/soundEngine'
import './PlayersScreen.css'

const ALL_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

const FILTERS = [
  { id: 'all',        label: 'Wszyscy', color: null },
  { id: 'attack',     label: 'ATK',     color: '#ef5350' },
  { id: 'midfield',   label: 'MID',     color: '#ab47bc' },
  { id: 'defense',    label: 'DEF',     color: '#448aff' },
  { id: 'goalkeeper', label: 'GK',      color: '#26a69a' },
]

const SORTS = [
  { id: 'atk',    label: 'ATK ↓' },
  { id: 'def',    label: 'DEF ↓' },
  { id: 'rarity', label: 'Rzadkość' },
  { id: 'name',   label: 'Nazwa' },
]

const RARITY_ORDER = { legendary: 0, rare: 1, common: 2, starter: 3 }

function buildDisplayCard(owned, def) {
  if (!def) return null
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

export default function PlayersScreen() {
  const router = useRouter()
  const { profile, upgradeCard } = useProfile()
  const [filter, setFilter] = useState('all')
  const [sortIdx, setSortIdx] = useState(0)
  const [selected, setSelected] = useState(null)

  const sort = SORTS[sortIdx].id

  const allCards = useMemo(() => (
    profile.ownedCards
      .map(o => {
        const def = ALL_DEFS.find(d => d.id === o.cardId)
        return { owned: o, def, card: buildDisplayCard(o, def) }
      })
      .filter(x => x.card)
  ), [profile.ownedCards])

  const legendaryCount = useMemo(() => allCards.filter(x => x.def?.rarity === 'legendary').length, [allCards])
  const maxedCount     = useMemo(() => allCards.filter(x => (x.owned.upgradeLevel || 0) >= 3).length, [allCards])

  const displayed = useMemo(() => {
    const filtered = filter === 'all' ? allCards : allCards.filter(x => x.def?.type === filter)
    const s = [...filtered]
    switch (sort) {
      case 'atk':    return s.sort((a, b) => (b.card.currentAttackStat  ?? 0) - (a.card.currentAttackStat  ?? 0))
      case 'def':    return s.sort((a, b) => (b.card.currentDefenseStat ?? 0) - (a.card.currentDefenseStat ?? 0))
      case 'rarity': return s.sort((a, b) => (RARITY_ORDER[a.card.rarity] ?? 9) - (RARITY_ORDER[b.card.rarity] ?? 9))
      case 'name':   return s.sort((a, b) => a.card.name.localeCompare(b.card.name))
      default:       return s
    }
  }, [allCards, filter, sort])

  const selectedEntry = selected ? allCards.find(x => x.owned.instanceId === selected) : null
  const { owned: selOwned, def: selDef, card: selCard } = selectedEntry || {}
  const upgradeLevel = selOwned?.upgradeLevel || 0
  const upgradeCost  = selDef?.upgradeCost?.[upgradeLevel]
  const canUpgrade   = upgradeLevel < 3 && upgradeCost != null && profile.coins >= upgradeCost

  const handleUpgrade = () => {
    if (!selected || !canUpgrade) return
    upgradeCard(selected)
    if (upgradeLevel + 1 >= 3) SFX.maxUpgrade()
  }

  const cycleSort = () => setSortIdx(i => (i + 1) % SORTS.length)

  const activeFilter = FILTERS.find(f => f.id === filter)

  return (
    <div className="ps-screen">
      {/* Header */}
      <div className="ps-header">
        <button className="back-btn" onClick={() => router.goBack()}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div className="ps-title-group">
          <h1 className="ps-title">Zawodnicy</h1>
          <span className="ps-subtitle">{allCards.length} kart w kolekcji</span>
        </div>
        <CurrencyBar />
      </div>

      {/* Stats strip */}
      <div className="ps-stats-strip">
        <div className="ps-stat-chip">
          <span className="ps-stat-chip-val">{allCards.length}</span>
          <span className="ps-stat-chip-lbl">Łącznie</span>
        </div>
        <div className="ps-stat-chip ps-stat-chip--gold">
          <span className="ps-stat-chip-val">{legendaryCount}</span>
          <span className="ps-stat-chip-lbl">Legendarne</span>
        </div>
        <div className="ps-stat-chip ps-stat-chip--blue">
          <span className="ps-stat-chip-val">{maxedCount}</span>
          <span className="ps-stat-chip-lbl">Max poziom</span>
        </div>
      </div>

      {/* Filter tabs + sort button */}
      <div className="ps-filter-bar">
        <div className="ps-tabs">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`ps-tab ${filter === f.id ? 'ps-tab--on' : ''}`}
              style={filter === f.id && f.color ? { '--tab-c': f.color } : {}}
              onClick={() => { setFilter(f.id); setSelected(null) }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="ps-sort-btn" onClick={cycleSort}>
          {SORTS[sortIdx].label} ⇅
        </button>
      </div>

      {/* Count row */}
      <div className="ps-count-row">
        <span className="ps-count-num">{displayed.length}</span>
        <span className="ps-count-lbl">
          {filter === 'all' ? 'zawodników' : (
            <span style={{ color: activeFilter?.color || 'inherit' }}>{activeFilter?.label}</span>
          )}
        </span>
      </div>

      {/* Grid */}
      <div className="ps-grid">
        {displayed.map(({ owned, card }) => (
          <div
            key={owned.instanceId}
            className={`ps-cell ${selected === owned.instanceId ? 'ps-cell--on' : ''}`}
            onClick={() => setSelected(p => p === owned.instanceId ? null : owned.instanceId)}
          >
            <FieldCard card={card} selected={selected === owned.instanceId} />
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="ps-empty">Brak kart w tej kategorii</div>
        )}
      </div>

      {/* Detail bottom sheet */}
      {selCard && selDef && (
        <div className="ps-sheet" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="ps-sheet-panel">
            <div className="ps-sheet-handle" />

            <div className="ps-sheet-top">
              {/* Card with glow */}
              <div className="ps-sheet-card-wrap">
                <div
                  className="ps-card-glow"
                  style={{ background: selCard.color || 'rgba(0,230,118,0.3)' }}
                />
                <FieldCard card={selCard} />
              </div>

              {/* Right column */}
              <div className="ps-sheet-info">
                <div className="psi-name">{selCard.name}</div>
                <div className="psi-meta">
                  <span className="psi-type-badge" style={{ background: selCard.color || '#333' }}>
                    {selCard.typeLabel}
                  </span>
                  <span className="psi-rarity">{selCard.rarity || 'common'}</span>
                  {selOwned.isStarter && <span className="psi-starter">Starter</span>}
                </div>

                {/* Stats */}
                <div className="psi-stats">
                  <div className="psi-stat psi-stat--atk">
                    <span className="psi-slabel">ATK</span>
                    <span className="psi-sval">{selCard.currentAttackStat}</span>
                  </div>
                  <div className="psi-stat psi-stat--def">
                    <span className="psi-slabel">DEF</span>
                    <span className="psi-sval">{selCard.currentDefenseStat}</span>
                  </div>
                  <div className="psi-stat">
                    <span className="psi-slabel">LVL</span>
                    <span className="psi-sval">{upgradeLevel}/3</span>
                  </div>
                </div>

                {/* Upgrade pips */}
                <div className="psi-pips">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`psi-pip ${i < upgradeLevel ? 'psi-pip--on' : ''} ${upgradeLevel >= 3 ? 'psi-pip--max' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Ability */}
            {selCard.abilityName && (
              <div className="psi-ability">
                <span className="psi-ability-name">{selCard.abilityName}</span>
                {selCard.abilityDescription && (
                  <span className="psi-ability-desc">{selCard.abilityDescription}</span>
                )}
                {selCard.noActivationDescription && (
                  <span className="psi-noact">
                    <span className="psi-noact-lbl">Brak aktywacji: </span>
                    {selCard.noActivationDescription}
                  </span>
                )}
              </div>
            )}

            {/* Upgrade info + CTA */}
            {upgradeLevel < 3 ? (
              <>
                {selDef.upgradeStatBonus && (() => {
                  const isPrimAtk = selDef.type === 'attack' ||
                    (selDef.type === 'midfield' && selDef.attackStat >= selDef.defenseStat)
                  const primaryStat = isPrimAtk ? 'ATK' : 'DEF'
                  const maxBonus = selDef.maxLevelBonus ?? (selDef.rarity === 'legendary' ? 5 : 3)
                  return (
                    <div className="psi-upgrade-info">
                      +{selDef.upgradeStatBonus} {primaryStat} za poziom
                      <span className="psi-max-bonus"> · Max: +{maxBonus} ekstra</span>
                    </div>
                  )
                })()}
                <button
                  className={`psi-upgrade-btn ${!canUpgrade ? 'psi-upgrade-btn--off' : ''}`}
                  onClick={handleUpgrade}
                  disabled={!canUpgrade}
                >
                  ↑ Ulepsz
                  <span className="psi-upgrade-cost">
                    {upgradeCost ?? '—'}
                    {!canUpgrade && profile.coins < (upgradeCost || 0) && ' · brak monet'}
                  </span>
                </button>
              </>
            ) : (
              <div className="psi-maxed">✦ Maksymalny poziom — karta przebudzona!</div>
            )}

            {selOwned.isStarter && (
              <p className="psi-starter-note">Karta startowa · nie można sprzedać</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
