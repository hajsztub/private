import React, { useState, useEffect } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import CurrencyBar from '../components/CurrencyBar'
import './MarketScreen.css'

const ALL_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

// ── Pack definitions ───────────────────────────────────────────────────────

const PACKS = [
  {
    id: 'random',
    label: 'Losowa Paczka',
    desc: '3 losowe karty • min. 1 Rzadka',
    icon: '🎲',
    cost: 80,
    currency: 'coins',
    gradient: 'linear-gradient(135deg,#1565c0,#283593)',
    filter: d => d.marketPrice > 0,
  },
  {
    id: 'attack',
    label: 'Paczka Ataku',
    desc: '3 karty napastników',
    icon: '⚔️',
    cost: 100,
    currency: 'coins',
    gradient: 'linear-gradient(135deg,#b71c1c,#7f0000)',
    filter: d => d.type === 'attack' && d.marketPrice > 0,
  },
  {
    id: 'defense',
    label: 'Paczka Obrony',
    desc: '3 karty obrońców',
    icon: '🛡️',
    cost: 100,
    currency: 'coins',
    gradient: 'linear-gradient(135deg,#0d47a1,#1a237e)',
    filter: d => d.type === 'defense' && d.marketPrice > 0,
  },
  {
    id: 'midfield',
    label: 'Paczka Środka',
    desc: '3 karty pomocników',
    icon: '🔮',
    cost: 100,
    currency: 'coins',
    gradient: 'linear-gradient(135deg,#4a148c,#1a0053)',
    filter: d => d.type === 'midfield' && d.marketPrice > 0,
  },
  {
    id: 'gk',
    label: 'Paczka Bramkarzy',
    desc: '3 karty bramkarzy',
    icon: '🧤',
    cost: 120,
    currency: 'coins',
    gradient: 'linear-gradient(135deg,#006064,#002f34)',
    filter: d => d.type === 'goalkeeper' && d.marketPrice > 0,
  },
  {
    id: 'premium',
    label: 'Paczka Premium',
    desc: 'Gwarantowana karta Legendarna!',
    icon: '💎',
    cost: 5,
    currency: 'gems',
    gradient: 'linear-gradient(135deg,#880e4f,#4a0072)',
    filter: d => d.rarity === 'legendary' || d.rarity === 'rare',
  },
]

const PACK_REFUND = 30 // coins you get if you decline the card

// ── Helpers ────────────────────────────────────────────────────────────────

function drawCards(pack, count = 3) {
  const pool = CARD_DEFINITIONS.filter(pack.filter)
  if (pool.length === 0) return []
  const drawn = []
  for (let i = 0; i < count; i++) {
    drawn.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return drawn
}

function CardChip({ def, onClick, picked }) {
  const TYPE_C = { attack: '#b71c1c', midfield: '#6a1b9a', defense: '#0d47a1', goalkeeper: '#37474f' }
  const RARITY_C = { common: '#9e9e9e', rare: '#ff9800', legendary: '#ffd700', starter: '#607d8b' }
  return (
    <div
      className={`pack-card-chip ${picked ? 'pack-card-chip--picked' : ''}`}
      style={{ background: def.color || '#eee', borderColor: RARITY_C[def.rarity] || '#ccc' }}
      onClick={onClick}
    >
      <div className="pcc-top">
        <span className="pcc-type" style={{ background: TYPE_C[def.type] || '#555' }}>{def.typeLabel}</span>
        <span className="pcc-rarity" style={{ color: RARITY_C[def.rarity] }}>{def.rarity === 'legendary' ? '★★★' : def.rarity === 'rare' ? '★★' : '★'}</span>
      </div>
      <div className="pcc-name">{def.name}</div>
      <div className="pcc-stats">
        <span className="pcc-atk">{def.attackStat} ATK</span>
        <span className="pcc-def">{def.defenseStat} DEF</span>
      </div>
      <div className="pcc-ability">{def.abilityName}</div>
      {picked && <div className="pcc-check">✓</div>}
    </div>
  )
}

// ── Pack Opening Overlay ───────────────────────────────────────────────────

function PackOpenOverlay({ pack, drawnCards, onPick, onTakeCoins, onClose }) {
  const [revealed, setRevealed] = useState(0)
  const [picked, setPicked] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (revealed < drawnCards.length) {
      const t = setTimeout(() => setRevealed(r => r + 1), 450)
      return () => clearTimeout(t)
    }
  }, [revealed, drawnCards.length])

  const handlePick = (def) => {
    if (done) return
    setPicked(def)
    setDone(true)
    setTimeout(() => onPick(def), 500)
  }

  const handleCoins = () => {
    if (done) return
    setDone(true)
    setTimeout(() => onTakeCoins(), 400)
  }

  return (
    <div className="pack-overlay">
      <div className="pack-overlay-panel">
        <div className="pack-overlay-title" style={{ background: pack.gradient }}>
          {pack.icon} {pack.label}
        </div>

        <div className="pack-cards-row">
          {drawnCards.map((def, i) => (
            <div
              key={i}
              className={`pack-card-slot ${i < revealed ? 'pack-card-slot--shown' : 'pack-card-slot--hidden'}`}
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              {i < revealed ? (
                <CardChip def={def} onClick={() => handlePick(def)} picked={picked === def} />
              ) : (
                <div className="pack-card-back">
                  <span>⚽</span>
                  <span className="pcb-sub">FC</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {revealed >= drawnCards.length && !done && (
          <div className="pack-actions">
            <p className="pack-prompt">Wybierz kartę lub weź monety</p>
            <button className="pack-coins-btn" onClick={handleCoins}>
              🪙 +{PACK_REFUND} monet zamiast karty
            </button>
          </div>
        )}

        {done && (
          <div className="pack-done">
            {picked ? `✅ Dodano ${picked.name} do kolekcji!` : `🪙 Otrzymano ${PACK_REFUND} monet!`}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sell Tab ───────────────────────────────────────────────────────────────

function SellTab({ profile, sellCard, showNotif }) {
  const [selected, setSelected] = useState(null)

  const sellableCards = profile.ownedCards
    .filter(o => !o.isStarter)
    .map(o => {
      const def = ALL_DEFS.find(d => d.id === o.cardId)
      if (!def) return null
      return { owned: o, def }
    })
    .filter(Boolean)

  const TYPE_LABEL = { attack: 'ATK', midfield: 'MID', defense: 'DEF', goalkeeper: 'GK' }
  const TYPE_C = { attack: '#b71c1c', midfield: '#6a1b9a', defense: '#0d47a1', goalkeeper: '#37474f' }

  return (
    <div className="sell-tab">
      {sellableCards.length === 0 ? (
        <div className="market-empty">
          <div className="market-empty-icon">📤</div>
          <p>Brak kart do sprzedania.</p>
          <p>Karty startowe nie mogą być sprzedane.<br/>Otwórz paczki aby zdobyć nowe karty.</p>
        </div>
      ) : (
        <div className="sell-grid">
          {sellableCards.map(({ owned, def }) => {
            const isSelected = selected === owned.instanceId
            return (
              <div
                key={owned.instanceId}
                className={`sell-item ${isSelected ? 'sell-item--selected' : ''}`}
                style={{ background: def.color || '#eee' }}
                onClick={() => setSelected(p => p === owned.instanceId ? null : owned.instanceId)}
              >
                <div className="si-top">
                  <span className="si-type" style={{ background: TYPE_C[def.type] }}>{def.typeLabel}</span>
                  {(owned.upgradeLevel || 0) > 0 && (
                    <span className="si-lvl">+{owned.upgradeLevel}</span>
                  )}
                </div>
                <div className="si-name">{def.name}</div>
                <div className="si-stats">{def.attackStat}/{def.defenseStat}</div>
                <div className="si-price">🪙 {def.sellPrice}</div>
                {isSelected && (
                  <button
                    className="si-sell-btn"
                    onClick={e => {
                      e.stopPropagation()
                      sellCard(owned.instanceId)
                      showNotif(`Sprzedano ${def.name} za ${def.sellPrice} 🪙`, true)
                      setSelected(null)
                    }}
                  >
                    Sprzedaj
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── MarketScreen ───────────────────────────────────────────────────────────

export default function MarketScreen() {
  const { goBack } = useRouter()
  const { profile, sellCard, addCoins, spendCoins, claimPackCard } = useProfile()
  const [tab, setTab] = useState('packs')
  const [openingPack, setOpeningPack] = useState(null) // { pack, cards }
  const [notification, setNotification] = useState(null)
  const gems = profile.gems ?? 0

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 2800)
  }

  const { update } = useProfile()

  const handleBuyPack = (pack) => {
    if (pack.currency === 'coins') {
      if (profile.coins < pack.cost) { showNotif('Za mało monet! 🪙', false); return }
      spendCoins(pack.cost)
    } else {
      if (gems < pack.cost) { showNotif('Za mało klejnotów! 💎', false); return }
      update(prev => ({ ...prev, gems: (prev.gems ?? 0) - pack.cost }))
    }
    const drawn = drawCards(pack)
    setOpeningPack({ pack, cards: drawn })
  }

  const handlePickCard = (def) => {
    claimPackCard(def)
    setOpeningPack(null)
    showNotif(`🎉 ${def.name} dodany do kolekcji!`)
  }

  const handleTakeCoins = () => {
    addCoins(PACK_REFUND)
    setOpeningPack(null)
    showNotif(`🪙 +${PACK_REFUND} monet!`)
  }

  const handleWatchAd = () => {
    showNotif('📺 Oglądasz reklamę...', true)
    setTimeout(() => {
      const giveGem = Math.random() < 0.4
      if (giveGem) {
        update(prev => ({ ...prev, gems: (prev.gems ?? 0) + 1 }))
        showNotif('✅ +1 💎 klejnot za reklamę!')
      } else {
        addCoins(50)
        showNotif('✅ +50 🪙 monet za reklamę!')
      }
    }, 2200)
  }

  return (
    <div className="market-screen">
      <div className="market-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <h1 className="market-title">Market</h1>
        <CurrencyBar onGemsClick={handleWatchAd} />
      </div>

      <div className="market-tabs">
        <button className={`market-tab ${tab === 'packs' ? 'market-tab--active' : ''}`} onClick={() => setTab('packs')}>
          📦 Paczki
        </button>
        <button className={`market-tab ${tab === 'sell' ? 'market-tab--active' : ''}`} onClick={() => setTab('sell')}>
          📤 Sprzedaj
        </button>
      </div>

      {tab === 'packs' ? (
        <div className="packs-list">
          {/* Earn gems banner */}
          <div className="earn-gems-banner" onClick={handleWatchAd}>
            <span className="egb-icon">📺</span>
            <div className="egb-text">
              <span className="egb-title">Obejrzyj reklamę</span>
              <span className="egb-desc">Zdobądź 50 monet lub 💎 klejnoty</span>
            </div>
            <span className="egb-cta">OBEJRZYJ →</span>
          </div>

          {PACKS.map(pack => {
            const canAfford = pack.currency === 'coins'
              ? profile.coins >= pack.cost
              : gems >= pack.cost
            return (
              <div
                key={pack.id}
                className={`pack-item ${!canAfford ? 'pack-item--locked' : ''}`}
                style={{ background: pack.gradient }}
              >
                <div className="pi-icon">{pack.icon}</div>
                <div className="pi-info">
                  <div className="pi-name">{pack.label}</div>
                  <div className="pi-desc">{pack.desc}</div>
                </div>
                <button
                  className={`pi-buy-btn ${!canAfford ? 'pi-buy-btn--disabled' : ''}`}
                  onClick={() => canAfford && handleBuyPack(pack)}
                  disabled={!canAfford}
                >
                  {pack.currency === 'coins' ? '🪙' : '💎'} {pack.cost}
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <SellTab profile={profile} sellCard={sellCard} showNotif={showNotif} />
      )}

      {openingPack && (
        <PackOpenOverlay
          pack={openingPack.pack}
          drawnCards={openingPack.cards}
          onPick={handlePickCard}
          onTakeCoins={handleTakeCoins}
          onClose={() => setOpeningPack(null)}
        />
      )}

      {notification && (
        <div className={`market-notif ${notification.ok ? 'market-notif--ok' : 'market-notif--err'}`}>
          {notification.msg}
        </div>
      )}
    </div>
  )
}
