import React, { useState, useEffect } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import CurrencyBar from '../components/CurrencyBar'
import FieldCard from '../components/FieldCard'
import './MarketScreen.css'

function defToSellCard(def, owned) {
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
    cost: 450,
    gemCost: 2,
    currency: 'coins',
    iconBg: 'linear-gradient(160deg,#1565c0,#283593)',
    itemBg: 'linear-gradient(120deg,#0d1b3e 0%,#1a2a5e 100%)',
    filter: d => d.marketPrice > 0,
  },
  {
    id: 'attack',
    label: 'Paczka Ataku',
    desc: '3 karty napastników',
    icon: '⚔️',
    cost: 550,
    gemCost: 3,
    currency: 'coins',
    iconBg: 'linear-gradient(160deg,#c62828,#7f0000)',
    itemBg: 'linear-gradient(120deg,#2a0a0a 0%,#4a1010 100%)',
    filter: d => d.type === 'attack' && d.marketPrice > 0,
  },
  {
    id: 'defense',
    label: 'Paczka Obrony',
    desc: '3 karty obrońców',
    icon: '🛡️',
    cost: 550,
    gemCost: 3,
    currency: 'coins',
    iconBg: 'linear-gradient(160deg,#0d47a1,#1a237e)',
    itemBg: 'linear-gradient(120deg,#071530 0%,#0d2560 100%)',
    filter: d => d.type === 'defense' && d.marketPrice > 0,
  },
  {
    id: 'midfield',
    label: 'Paczka Środka',
    desc: '3 karty pomocników',
    icon: '🔮',
    cost: 550,
    gemCost: 3,
    currency: 'coins',
    iconBg: 'linear-gradient(160deg,#6a1b9a,#4a148c)',
    itemBg: 'linear-gradient(120deg,#1a0830 0%,#2e1060 100%)',
    filter: d => d.type === 'midfield' && d.marketPrice > 0,
  },
  {
    id: 'gk',
    label: 'Paczka Bramkarzy',
    desc: '3 karty bramkarzy',
    icon: '🧤',
    cost: 650,
    gemCost: 3,
    currency: 'coins',
    iconBg: 'linear-gradient(160deg,#00695c,#004d40)',
    itemBg: 'linear-gradient(120deg,#021a16 0%,#063d30 100%)',
    filter: d => d.type === 'goalkeeper' && d.marketPrice > 0,
  },
  {
    id: 'mega',
    label: 'Mega Paczka',
    desc: '5 kart • 15% Legendarny • ~50% Rzadkie',
    icon: '🏆',
    cost: 1200,
    gemCost: 6,
    currency: 'coins',
    iconBg: 'linear-gradient(160deg,#e65100,#bf360c)',
    itemBg: 'linear-gradient(120deg,#2a0e00 0%,#4a1a00 100%)',
    filter: d => d.marketPrice > 0,
  },
  {
    id: 'premium',
    label: 'Paczka Premium',
    desc: '5 kart • Gwarantowana Legendarny!',
    icon: '💎',
    cost: 12,
    currency: 'gems',
    iconBg: 'linear-gradient(160deg,#880e4f,#4a0072)',
    itemBg: 'linear-gradient(120deg,#1a0020 0%,#380060 100%)',
    filter: d => d.rarity === 'legendary' || d.rarity === 'rare',
  },
]

const PACK_REFUND = 80
const AD_COOLDOWN_MS = 60 * 60 * 1000
const FREE_PACK_COOLDOWN_MS = 12 * 60 * 60 * 1000

const FREE_PACK_META = {
  id: 'free',
  label: 'Darmowa Paczka',
  desc: '1 losowa karta + 30 monet',
  icon: '🎁',
  iconBg: 'linear-gradient(160deg, #1a4a10, #2d6e1a)',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function drawCards(pack) {
  const pool = CARD_DEFINITIONS.filter(pack.filter)
  if (pool.length === 0) return []
  const legendaries = pool.filter(c => c.rarity === 'legendary')
  const rares = pool.filter(c => c.rarity === 'rare')
  const commons = pool.filter(c => c.rarity !== 'legendary' && c.rarity !== 'rare')

  const isPremium = pack.id === 'premium'
  const isMega = pack.id === 'mega'
  const count = (isPremium || isMega) ? 5 : 3

  const legChance = isMega ? 0.15 : (isPremium ? 1.0 : 0.05)
  const rareChance = isMega ? 0.65 : (isPremium ? 1.0 : 0.30)

  function pickOne() {
    const roll = Math.random()
    if (roll < legChance && legendaries.length) return legendaries[Math.floor(Math.random() * legendaries.length)]
    if (roll < rareChance && rares.length)      return rares[Math.floor(Math.random() * rares.length)]
    if (commons.length)                          return commons[Math.floor(Math.random() * commons.length)]
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const drawn = []
  if (isPremium && legendaries.length) {
    drawn.push(legendaries[Math.floor(Math.random() * legendaries.length)])
    for (let i = 1; i < count; i++) drawn.push(pickOne())
  } else {
    for (let i = 0; i < count; i++) drawn.push(pickOne())
  }
  return drawn
}

function defToCard(def) {
  return {
    ...def,
    instanceId: `preview_${def.id}_${Math.random()}`,
    currentAttackStat: def.attackStat,
    currentDefenseStat: def.defenseStat,
    upgradeLevel: 0,
  }
}

function useCooldown(lastAt, durationMs) {
  const compute = () => Math.max(0, Math.ceil((durationMs - (Date.now() - (lastAt || 0))) / 1000))
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
  }, [lastAt])
  return secsLeft
}

function fmtCountdown(secs) {
  if (secs >= 3600) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Pack Opening Overlay ───────────────────────────────────────────────────

function PackOpenOverlay({ pack, drawnCards, onPick, onTakeCoins }) {
  const [revealed, setRevealed] = useState(0)
  const [picked, setPicked] = useState(null)
  const [done, setDone] = useState(false)
  const [legendaryFlash, setLegendaryFlash] = useState(false)

  useEffect(() => {
    if (revealed < drawnCards.length) {
      const delay = drawnCards[revealed]?.rarity === 'legendary' ? 750 : 480
      const t = setTimeout(() => {
        if (drawnCards[revealed]?.rarity === 'legendary') setLegendaryFlash(true)
        setRevealed(r => r + 1)
      }, delay)
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
    setTimeout(() => onTakeCoins?.(), 400)
  }

  return (
    <div className={`pack-overlay ${legendaryFlash ? 'pack-overlay--legendary-flash' : ''}`}>
      <div className="pack-overlay-panel">
        <div className="pack-overlay-header" style={{ background: pack.iconBg }}>
          <span className="poh-icon">{pack.icon}</span>
          <span className="poh-title">{pack.label}</span>
          <span className="poh-desc">{pack.desc}</span>
        </div>

        <div className="pack-cards-row">
          {drawnCards.map((def, i) => {
            const card = defToCard(def)
            const isSelected = picked === def
            const isLegendary = def.rarity === 'legendary'
            return (
              <div
                key={i}
                className={`pack-card-slot ${i < revealed ? 'pack-card-slot--shown' : 'pack-card-slot--hidden'} ${isSelected ? 'pack-card-slot--picked' : ''} ${i < revealed && isLegendary ? 'pack-card-slot--legendary' : ''}`}
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

        {revealed >= drawnCards.length && !done && (
          <div className="pack-actions">
            <p className="pack-prompt">Wybierz kartę aby dodać do kolekcji</p>
            {onTakeCoins && (
              <button className="pack-coins-btn" onClick={handleCoins}>
                🪙 +{PACK_REFUND} MONET ZAMIAST KARTY
              </button>
            )}
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

// ── Ad Reward Overlay ─────────────────────────────────────────────────────

function AdRewardOverlay({ reward, onDismiss }) {
  const isGem = reward.type === 'gems'
  return (
    <div className="ar-overlay" onClick={onDismiss}>
      <div className="ar-panel" onClick={e => e.stopPropagation()}>
        <div className="ar-icon-wrap">
          <span className="ar-icon">{isGem ? '💎' : '🪙'}</span>
        </div>
        <div className="ar-amount">+{reward.amount}</div>
        <div className="ar-label">{isGem ? 'KLEJNOT' : 'MONET'}</div>
        <p className="ar-desc">Za obejrzenie reklamy</p>
        <button className="ar-btn" onClick={onDismiss}>ODBIERZ</button>
      </div>
    </div>
  )
}

// ── Sell Tab ───────────────────────────────────────────────────────────────

function SellTab({ profile, sellCard, showNotif }) {
  const [selected, setSelected] = useState(null)
  const [sort, setSort] = useState('dupes')

  const sellableCards = profile.ownedCards
    .filter(o => !o.isStarter)
    .map(o => {
      const def = ALL_DEFS.find(d => d.id === o.cardId)
      if (!def) return null
      return { owned: o, def, card: defToSellCard(def, o) }
    })
    .filter(Boolean)

  const countById = {}
  for (const { def } of sellableCards) countById[def.id] = (countById[def.id] || 0) + 1

  const sorted = [...sellableCards].sort((a, b) => {
    if (sort === 'dupes') {
      const diff = (countById[b.def.id] || 0) - (countById[a.def.id] || 0)
      if (diff !== 0) return diff
      return a.def.name.localeCompare(b.def.name)
    }
    if (sort === 'name') return a.def.name.localeCompare(b.def.name)
    if (sort === 'price') return (b.def.sellPrice || 0) - (a.def.sellPrice || 0)
    return 0
  })

  const SORTS = [
    { id: 'dupes', label: '2× Duplikaty' },
    { id: 'name',  label: 'A–Z Nazwa' },
    { id: 'price', label: '🪙 Cena' },
  ]

  return (
    <div className="sell-tab">
      {sellableCards.length === 0 ? (
        <div className="market-empty">
          <div className="market-empty-icon">📤</div>
          <p>Brak kart do sprzedania.</p>
          <p>Karty startowe nie mogą być sprzedane.<br/>Otwórz paczki aby zdobyć nowe karty.</p>
        </div>
      ) : (
        <>
          <div className="sell-sort-bar">
            {SORTS.map(s => (
              <button
                key={s.id}
                className={`sell-sort-btn ${sort === s.id ? 'sell-sort-btn--active' : ''}`}
                onClick={() => setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="sell-list">
            {sorted.map(({ owned, def, card }) => {
              const isSelected = selected === owned.instanceId
              const count = countById[def.id] || 1
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
                    <div className="sr-name">
                      {def.name}
                      {count > 1 && <span className="sr-dupe-badge">×{count}</span>}
                    </div>
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
        </>
      )}
    </div>
  )
}

// ── MarketScreen ───────────────────────────────────────────────────────────

// ── Shop Tab ───────────────────────────────────────────────────────────────

const SHOP_REFRESH_MS = 12 * 60 * 60 * 1000
const TYPE_LABELS = { attack: 'Napastnik', defense: 'Obrońca', midfield: 'Pomocnik', goalkeeper: 'Bramkarz' }

function ShopTab({ profile, refreshCardShop, buyShopCard, showNotif }) {
  const shop = profile.cardShop || { cardIds: [], refreshedAt: 0 }

  useEffect(() => {
    const age = Date.now() - (shop.refreshedAt || 0)
    if (!shop.cardIds?.length || age >= SHOP_REFRESH_MS) refreshCardShop()
  }, [])

  const secsLeft = useCooldown(shop.refreshedAt, SHOP_REFRESH_MS)

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60
    return h > 0 ? `${h}h ${m}m` : `${m}:${String(sec).padStart(2, '0')}`
  }

  const shopCards = (shop.cardIds || []).map(id => {
    const def = CARD_DEFINITIONS.find(d => d.id === id)
    if (!def) return null
    return { def, card: defToCard(def), price: (def.sellPrice || 0) * 2 }
  }).filter(Boolean)

  return (
    <div className="shop-tab">
      <div className="shop-header">
        <div className="shop-title">🛒 SKLEP ZAWODNIKÓW</div>
        <div className="shop-refresh">{secsLeft > 0 ? `Odświeżenie za ${fmtTime(secsLeft)}` : 'Odświeżanie...'}</div>
      </div>
      {shopCards.length === 0 ? (
        <div className="market-empty">
          <div className="market-empty-icon">🛒</div>
          <p>Ładowanie sklepu...</p>
        </div>
      ) : (
        <div className="shop-cards-list">
          {shopCards.map(({ def, card, price }) => {
            const canAfford = profile.coins >= price
            const alreadyOwned = profile.ownedCards.some(o => o.cardId === def.id)
            return (
              <div key={def.id} className={`shop-row ${!canAfford ? 'shop-row--locked' : ''}`}>
                <div className="shop-row-card">
                  <FieldCard card={card} />
                </div>
                <div className="shop-row-info">
                  <div className="shop-row-name">{def.name}</div>
                  <div className="shop-row-type">{TYPE_LABELS[def.type] || def.type}</div>
                  <div className="shop-row-ability">{def.abilityName}</div>
                  {alreadyOwned && <div className="shop-row-owned">Już posiadasz ✓</div>}
                </div>
                <div className="shop-row-buy">
                  <div className="shop-row-price">🪙 {price}</div>
                  <button
                    className={`shop-buy-btn ${!canAfford ? 'shop-buy-btn--locked' : ''}`}
                    disabled={!canAfford}
                    onClick={() => { buyShopCard(def.id); showNotif(`🛒 ${def.name} kupiony!`) }}
                  >
                    KUP
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="shop-hint">💡 3 zawodników zmienia się co 12h • cena = 2× wartość sprzedaży</div>
    </div>
  )
}

// ── MarketScreen ───────────────────────────────────────────────────────────

export default function MarketScreen() {
  const { goBack } = useRouter()
  const { profile, sellCard, addCoins, spendCoins, claimPackCard, update, recordAdWatched, recordFreePackClaimed, refreshCardShop, buyShopCard } = useProfile()
  const [tab, setTab] = useState('packs')
  const [openingPack, setOpeningPack] = useState(null)
  const [adReward, setAdReward] = useState(null)
  const [notification, setNotification] = useState(null)
  const gems = profile.gems ?? 0
  const adSecsLeft = useCooldown(profile.lastAdWatchedAt, AD_COOLDOWN_MS)
  const freePackSecsLeft = useCooldown(profile.lastFreePackAt, FREE_PACK_COOLDOWN_MS)

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 2800)
  }

  const handleBuyPack = (pack, useGems = false) => {
    if (pack.currency === 'gems' || useGems) {
      const cost = useGems ? pack.gemCost : pack.cost
      if (gems < cost) { showNotif('Za mało klejnotów! 💎', false); return }
      update(prev => ({ ...prev, gems: (prev.gems ?? 0) - cost }))
    } else {
      if (profile.coins < pack.cost) { showNotif('Za mało monet! 🪙', false); return }
      spendCoins(pack.cost)
    }
    const drawn = drawCards(pack)
    setOpeningPack({ pack, cards: drawn })
  }

  const handlePickCard = (def) => {
    claimPackCard(def)
    const isFree = openingPack?.isFree
    setOpeningPack(null)
    if (isFree) addCoins(30)
    showNotif(`🎉 ${def.name}${isFree ? ' + 30 🪙' : ''} dodany do kolekcji!`)
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
      if (Math.random() < 0.4) {
        update(prev => ({ ...prev, gems: (prev.gems ?? 0) + 1 }))
        setAdReward({ type: 'gems', amount: 1 })
      } else {
        addCoins(50)
        setAdReward({ type: 'coins', amount: 50 })
      }
    }, 2200)
  }

  const handleClaimFreePack = () => {
    if (freePackSecsLeft > 0) {
      showNotif(`⏳ Następna paczka za ${fmtCountdown(freePackSecsLeft)}`, false)
      return
    }
    const pool = CARD_DEFINITIONS.filter(d => d.marketPrice > 0 && d.rarity !== 'legendary')
    const card = pool[Math.floor(Math.random() * pool.length)]
    recordFreePackClaimed()
    setOpeningPack({ pack: FREE_PACK_META, cards: [card], isFree: true })
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
        <button className={`market-tab ${tab === 'shop' ? 'market-tab--active' : ''}`} onClick={() => setTab('shop')}>
          🛒 SKLEP
        </button>
        <button className={`market-tab ${tab === 'sell' ? 'market-tab--active' : ''}`} onClick={() => setTab('sell')}>
          💰 SPRZEDAJ
        </button>
      </div>

      {tab === 'shop' ? (
        <ShopTab profile={profile} refreshCardShop={refreshCardShop} buyShopCard={buyShopCard} showNotif={showNotif} />
      ) : tab === 'packs' ? (
        <div className="packs-list">

          {/* Ad banner */}
          <div className={`ad-banner ${adSecsLeft > 0 ? 'ad-banner--cooldown' : ''}`} onClick={handleWatchAd}>
            <div className="ad-text">
              <div className="ad-title">
                OBEJRZYJ <span className="ad-kw">REKLAMĘ</span>
              </div>
              <div className="ad-desc">
                {adSecsLeft > 0
                  ? `Dostępna za ${fmtCountdown(adSecsLeft)}`
                  : 'Zdobądź 50 monet lub 💎 klejnoty'}
              </div>
            </div>
            <div className="ad-ball">⚽</div>
            <div className={`ad-cta ${adSecsLeft > 0 ? 'ad-cta--wait' : ''}`}>
              {adSecsLeft > 0 ? fmtCountdown(adSecsLeft) : 'OBEJRZYJ →'}
            </div>
          </div>

          {/* Free pack */}
          <div
            className={`free-pack ${freePackSecsLeft > 0 ? 'free-pack--cooldown' : ''}`}
            onClick={handleClaimFreePack}
          >
            <div className="fp-icon">🎁</div>
            <div className="fp-info">
              <div className="fp-title">DARMOWA PACZKA</div>
              <div className="fp-desc">1 zawodnik + 30 monet • co 12 godzin</div>
            </div>
            <div className={`fp-cta ${freePackSecsLeft > 0 ? 'fp-cta--wait' : ''}`}>
              {freePackSecsLeft > 0 ? fmtCountdown(freePackSecsLeft) : 'ODBIERZ'}
            </div>
          </div>

          {/* Premium pack — full width */}
          {(() => {
            const prem = PACKS.find(p => p.id === 'premium')
            const canAfford = gems >= prem.cost
            return (
              <div className="pack-premium-card" style={{ background: prem.itemBg }}>
                <div className="ppc-badge">💎 PREMIUM</div>
                <div className="ppc-icon">{prem.icon}</div>
                <div className="ppc-info">
                  <div className="ppc-name">{prem.label}</div>
                  <div className="ppc-desc">{prem.desc}</div>
                </div>
                <button className={`ppc-buy${!canAfford ? ' ppc-buy--locked' : ''}`} onClick={() => handleBuyPack(prem)}>
                  💎 {prem.cost}
                </button>
              </div>
            )
          })()}

          {/* Coin pack grid */}
          <div className="packs-grid">
            {PACKS.filter(p => p.currency === 'coins').map(pack => {
              const canAffordCoins = profile.coins >= pack.cost
              const canAffordGems = gems >= pack.gemCost
              return (
                <div key={pack.id} className="pack-card" style={{ background: pack.itemBg }}>
                  <div className="pc-header" style={{ background: pack.iconBg }}>
                    <span className="pc-icon">{pack.icon}</span>
                  </div>
                  <div className="pc-body">
                    <div className="pc-name">{pack.label}</div>
                    <div className="pc-desc">{pack.desc}</div>
                  </div>
                  <div className="pc-actions">
                    <button
                      className={`pc-buy-coin${!canAffordCoins ? ' pc-buy--locked' : ''}`}
                      onClick={() => handleBuyPack(pack, false)}
                    >
                      🪙 {pack.cost}
                    </button>
                    <button
                      className={`pc-buy-gem${!canAffordGems ? ' pc-buy--locked' : ''}`}
                      onClick={() => handleBuyPack(pack, true)}
                    >
                      lub 💎 {pack.gemCost}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <SellTab profile={profile} sellCard={sellCard} showNotif={showNotif} />
      )}


      {openingPack && (
        <PackOpenOverlay
          pack={openingPack.pack}
          drawnCards={openingPack.cards}
          onPick={handlePickCard}
          onTakeCoins={openingPack.isFree ? null : handleTakeCoins}
        />
      )}

      {adReward && (
        <AdRewardOverlay reward={adReward} onDismiss={() => setAdReward(null)} />
      )}

      {notification && (
        <div className={`market-notif ${notification.ok ? 'market-notif--ok' : 'market-notif--err'}`}>
          {notification.msg}
        </div>
      )}
    </div>
  )
}
