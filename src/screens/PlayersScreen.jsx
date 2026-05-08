import React, { useState } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import FieldCard from '../components/FieldCard'
import CurrencyBar from '../components/CurrencyBar'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import './PlayersScreen.css'

const ALL_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

const FILTERS = [
  { id: 'all',        label: 'Wszyscy' },
  { id: 'attack',     label: 'ATK' },
  { id: 'midfield',   label: 'MID' },
  { id: 'defense',    label: 'DEF' },
  { id: 'goalkeeper', label: 'GK' },
]

function buildDisplayCard(owned, def) {
  if (!def) return null
  const level = owned.upgradeLevel || 0
  const bonus = level * (def.upgradeStatBonus || 1)
  const isPrimAtk = def.type === 'attack' || (def.type === 'midfield' && def.attackStat >= def.defenseStat)
  return {
    ...def,
    instanceId: owned.instanceId,
    currentAttackStat: def.attackStat + (isPrimAtk ? bonus : 0),
    currentDefenseStat: def.defenseStat + (!isPrimAtk || def.type === 'goalkeeper' || def.type === 'defense' ? bonus : 0),
    upgradeLevel: level,
    isStarter: owned.isStarter,
  }
}

export default function PlayersScreen() {
  const router = useRouter()
  const { profile, upgradeCard } = useProfile()
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const allCards = profile.ownedCards
    .map(o => {
      const def = ALL_DEFS.find(d => d.id === o.cardId)
      return { owned: o, def, card: buildDisplayCard(o, def) }
    })
    .filter(x => x.card)

  const displayed = filter === 'all'
    ? allCards
    : allCards.filter(x => x.def?.type === filter)

  const selectedEntry = selected ? allCards.find(x => x.owned.instanceId === selected) : null
  const { owned: selOwned, def: selDef, card: selCard } = selectedEntry || {}
  const upgradeLevel = selOwned?.upgradeLevel || 0
  const upgradeCost = selDef?.upgradeCost?.[upgradeLevel]
  const canUpgrade = upgradeLevel < 3 && upgradeCost && profile.coins >= upgradeCost

  const handleUpgrade = () => {
    if (!selected || !canUpgrade) return
    upgradeCard(selected)
  }

  return (
    <div className="ps-screen">
      {/* Header */}
      <div className="ps-header">
        <button className="ps-back" onClick={() => router.goBack()}>←</button>
        <h1 className="ps-title">Zawodnicy</h1>
        <CurrencyBar />
      </div>

      {/* Filter pills */}
      <div className="ps-filters">
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`ps-pill ${filter === f.id ? 'ps-pill--on' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Album grid */}
      <div className="ps-grid">
        {displayed.map(({ owned, card }) => (
          <div
            key={owned.instanceId}
            className={`ps-cell ${selected === owned.instanceId ? 'ps-cell--on' : ''}`}
            onClick={() => setSelected(p => p === owned.instanceId ? null : owned.instanceId)}
          >
            <FieldCard
              card={card}
              selected={selected === owned.instanceId}
            />
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
            <div className="ps-sheet-body">
              <div className="ps-sheet-card">
                <FieldCard card={selCard} />
              </div>
              <div className="ps-sheet-info">
                <div className="psi-name">{selCard.name}</div>
                <div className="psi-meta">
                  <span className="psi-type-badge" style={{ background: selCard.color || '#333' }}>
                    {selCard.typeLabel}
                  </span>
                  <span className="psi-rarity">{selCard.rarity || 'common'}</span>
                  {selOwned.isStarter && <span className="psi-starter">Starter</span>}
                </div>
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
                {selCard.abilityName && (
                  <div className="psi-ability">
                    <span className="psi-ability-name">{selCard.abilityName}</span>
                    {selCard.abilityDescription && <span className="psi-ability-desc">{selCard.abilityDescription}</span>}
                    {selCard.noActivationDescription && (
                      <span className="psi-noact"><span className="psi-noact-lbl">Brak aktywacji:</span> {selCard.noActivationDescription}</span>
                    )}
                  </div>
                )}

                {(() => {
                  const isPrimAtk = selDef.type === 'attack' || selDef.type === 'midfield-atk-first' ||
                    (selDef.type === 'midfield' && selDef.attackStat >= selDef.defenseStat)
                  const primaryStat = isPrimAtk ? 'ATK' : 'DEF'
                  const bonus = selDef.upgradeStatBonus
                  return bonus ? (
                    <div className="psi-upgrade-info">
                      Ulepszenie: +{bonus} do {primaryStat}
                    </div>
                  ) : null
                })()}

                {upgradeLevel < 3 ? (
                  <button
                    className={`psi-upgrade-btn ${!canUpgrade ? 'psi-upgrade-btn--off' : ''}`}
                    onClick={handleUpgrade}
                    disabled={!canUpgrade}
                  >
                    ⬆ Ulepsz · {upgradeCost ?? '—'} 🪙
                    {!canUpgrade && profile.coins < (upgradeCost || 0) && (
                      <span className="psi-upgrade-hint"> (brak monet)</span>
                    )}
                  </button>
                ) : (
                  <div className="psi-maxed">✦ Maksymalny poziom</div>
                )}

                {selOwned.isStarter && (
                  <p className="psi-starter-note">Karta startowa · nie można sprzedać</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
