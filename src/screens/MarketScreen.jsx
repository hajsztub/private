import React, { useState, useEffect } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import CurrencyBar from '../components/CurrencyBar'
import FieldCard from '../components/FieldCard'
import './MarketScreen.css'

function defToSellCard(def, owned) {
  const bonus = (owned.upgradeLevel || 0) * (def.upgradeStatBonus || 1)
  return {
    ...def,
    instanceId: owned.instanceId,
    currentAttackStat: def.attackStat + bonus,
    currentDefenseStat: def.defenseStat + bonus,
    upgradeLevel: owned.upgradeLevel || 0,
  }
}

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
    iconBg: 'linear-gradient(135deg,#1565c0,#283593)',
    filter: d => d.marketPrice > 0,
  },
  {
    id: 'attack',
    label: 'Paczka Ataku',
    desc: '3 karty napastników',
    icon: '⚔️',
    cost: 100,
    currency: 'coins',
    iconBg: 'linear-gradient(135deg,#c62828,#7f0000)',
    filter: d => d.type === 'attack' && d.marketPrice > 0,
  },
  {
    id: 'defense',
    label: 'Paczka Obrony',
    desc: '3 karty obrońców',
    icon: '🛡️',
    cost: 100,
    currency: 'coins',
    iconBg: 'linear-gradient(135deg,#0d47a1,#1a237e)',
    filter: d => d.type === 'defense' && d.marketPrice > 0,
  },
  {
    id: 'midfield',
    label: 'Paczka Środka',
    desc: '3 karty pomocników',
    icon: '🔮',
    cost: 100,
    currency: 'coins',
    iconBg: 'linear-gradient(135deg,#6a1b9a,#4a148c)',
    filter: d => d.type === 'midfield' && d.marketPrice > 0,
  },
  {
    id: 'gk',
    label: 'Paczka Bramkarzy',
    desc: '3 karty bramkarzy',
    icon: '🧤',
    cost: 120,
    currency: 'coins',
    iconBg: 'linear-gradient(135deg,#00695c,#004d40)',
    filter: d => d.type === 'goalkeeper' && d.marketPrice > 0,
  },
  {
    id: 'premium',
    label: 'Paczka Premium',
    desc: 'Gwarantowana karta Legendarna!',
    icon: '💎',
    cost: 5,
    currency: 'gems',
    iconBg: 'linear-gradient(135deg,#880e4f,#4a0072)',
    filter: d => d.rarity === 'legendary' || d.rarity === 'rare',
  },
]

const PACK_REFUND = 30

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

// Convert card definition to a card object usable by FieldCard
function defToCard(def) {
  return {
    ...def,
    instanceId: `preview_${def.id}_${Math.random()}`,
    currentAttackStat: def.attackStat,
    currentDefenseStat: def.defenseStat,
    upgradeLevel: 0,
  }
}

// ── Pack Opening Overlay ───────────────────────────────────────────────────

function PackOpenOverlay({ pack, drawnCards, onPick, onTakeCoins }) {
  const [revealed, setRevealed] = useState(0)
  const [picked, setPicked] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (revealed < drawnCards.length) {
      const t = setTimeout(() => setRevealed(r => r + 1), 480)
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
        {/* Title */}
        <div className="pack-overlay-header" style={{ background: pack.iconBg }}>
          <span className="poh-icon">{pack.icon}</span>
          <span className="poh-title">{pack.label}</span>
          <span className="poh-desc">{pack.desc}</span>
        </div>

        {/* Cards */}
        <div className="pack-cards-row">
          {drawnCards.map((def, i) => {
            const card = defToCard(def)
            const isSelected = picked === def
            return (
              <div
                key={i}
                className={`pack-card-slot ${i < revealed ? 'pack-card-slot--shown' : 'pack-card-slot--hidden'} ${isSelected ? 'pack-card-slot--picked' : ''}`}
                style={{ transitionDelay: `${i * 0.06}s` }}
                onClick={() => i < revealed && handlePick(def)}
              >
                {i < revealed ? (
                  <FieldCard card={card} fieldSize />
                ) : (
                  <div className="pack-card-back">
                    <span className="pcb-ball">⚽</span>
                    <span className="pcb-sub">FC</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        {revealed >= drawnCards.length && !done && (
          <div className="pack-actions">
            <p className="pack-prompt">Wybierz kartę aby dodać do kolekcji</p>
            <button className="pack-coins-btn" onClick={handleCoins}>
              🪙 +{PACK_REFUND} MONET ZAMIAST KARTY
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
      return { owned: o, def, card: defToSellCard(def, o) }
    })
    .filter(Boolean)

  return (
    <div className="sell-tab">
      {sellableCards.length === 0 ? (
        <div className="market-empty">
          <div className="market-empty-icon">📤</div>
          <p>Brak kart do sprzedania.</p>
          <p>Karty startowe nie mogą być sprzedane.<br/>Otwórz paczki aby zdobyć nowe karty.</p>
        </div>
      ) : (
        <div className="sell-list">
          {sellableCards.map(({ owned, def, card }) => {
            const isSelected = selected === owned.instanceId
            return (
              <div
                key={owned.instanceId}
                className={`sell-row ${isSelected ? 'sell-row--selected' : ''}`}
                onClick={() => setSelected(p => p === owned.instanceId ? null : owned.instanceId)}
              >
                <div className="sr-card">
                  <FieldCard card={card} />
                </div>
                <div className="sr-info">
                  <div className="sr-name">{def.name}</div>
                  {(owned.upgradeLevel || 0) > 0 && (
                    <span className="sr-lvl">+{owned.upgradeLevel}</span>
                  )}
                  <div className="sr-ability">{def.abilityName}</div>
                  <div className="sr-price">🪙 {def.sellPrice}</div>
                </div>
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

const AD_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

function useAdCooldown(lastAdWatchedAt) {
  const compute = () => {
    const elapsed = Date.now() - (lastAdWatchedAt || 0)
    return Math.max(0, Math.ceil((AD_COOLDOWN_MS - elapsed) / 1000))
  }

  const [secsLeft, setSecsLeft] = useState(compute)

  useEffect(() => {
    const initial = compute()
    setSecsLeft(initial)
    if (initial <= 0) return
    const id = setInterval(() => {
      const left = compute()
      setSecsLeft(left)
      if (left <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [lastAdWatchedAt])

  return secsLeft
}

function fmtCountdown(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function MarketScreen() {
  const { goBack } = useRouter()
  const { profile, sellCard, addCoins, spendCoins, claimPackCard, update, recordAdWatched } = useProfile()
  const [tab, setTab] = useState('packs')
  const [openingPack, setOpeningPack] = useState(null)
  const [notification, setNotification] = useState(null)
  const gems = profile.gems ?? 0
  const adSecsLeft = useAdCooldown(profile.lastAdWatchedAt || 0)

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 2800)
  }

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
    if (adSecsLeft > 0) {
      showNotif(`⏳ Następna reklama za ${fmtCountdown(adSecsLeft)}`, false)
      return
    }
    showNotif('📺 Oglądasz reklamę...', true)
    recordAdWatched()
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
        <h1 className="market-title">MARKET</h1>
        <CurrencyBar onGemsClick={handleWatchAd} />
      </div>

      <div className="market-tabs">
        <button className={`market-tab ${tab === 'packs' ? 'market-tab--active' : ''}`} onClick={() => setTab('packs')}>
          📦 PACZKI
        </button>
        <button className={`market-tab ${tab === 'sell' ? 'market-tab--active' : ''}`} onClick={() => setTab('sell')}>
          🔒 SPRZEDAJ
        </button>
      </div>

      {tab === 'packs' ? (
        <div className="packs-list">
          {/* Earn banner */}
          <div className={`earn-gems-banner ${adSecsLeft > 0 ? 'earn-gems-banner--cooldown' : ''}`} onClick={handleWatchAd}>
            <div className="egb-icon-wrap">{adSecsLeft > 0 ? '⏳' : '📺'}</div>
            <div className="egb-text">
              <span className="egb-title">OBEJRZYJ REKLAMĘ</span>
              <span className="egb-desc">
                {adSecsLeft > 0
                  ? `Dostępna za ${fmtCountdown(adSecsLeft)}`
                  : 'Zdobądź 50 monet lub 💎 klejnoty'}
              </span>
            </div>
            <span className="egb-cta">
              {adSecsLeft > 0 ? fmtCountdown(adSecsLeft) : 'OBEJRZYJ →'}
            </span>
          </div>

          {PACKS.map(pack => {
            const canAfford = pack.currency === 'coins'
              ? profile.coins >= pack.cost
              : gems >= pack.cost
            return (
              <div
                key={pack.id}
                className={`pack-item ${!canAfford ? 'pack-item--locked' : ''}`}
                onClick={() => canAfford && handleBuyPack(pack)}
              >
                <div className="pi-icon-wrap" style={{ background: pack.iconBg }}>
                  <span className="pi-icon">{pack.icon}</span>
                </div>
                <div className="pi-info">
                  <div className="pi-name">{pack.label}</div>
                  <div className="pi-desc">{pack.desc}</div>
                </div>
                <div className={`pi-buy-btn ${!canAfford ? 'pi-buy-btn--disabled' : ''}`}>
                  <span className="pi-buy-cur">{pack.currency === 'coins' ? '🪙' : '💎'}</span>
                  <span className="pi-buy-val">{pack.cost}</span>
                </div>
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
