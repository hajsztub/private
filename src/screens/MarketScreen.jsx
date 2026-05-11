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
    icon: '◎',
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
    icon: '▶',
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
    icon: '◈',
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
    icon: '◉',
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
    icon: '★',
    cost: 950,
    gemCost: 5,
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
  icon: '★',
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
  const [flipped, setFlipped] = useState([])
  const [picked, setPicked] = useState(null)
  const [done, setDone] = useState(false)
  const [legendaryFlash, setLegendaryFlash] = useState(false)

  const allFlipped = flipped.length >= drawnCards.length

  useEffect(() => {
    let idx = 0
    function flipNext() {
      if (idx >= drawnCards.length) return
      const isLeg = drawnCards[idx]?.rarity === 'legendary'
      const delay = isLeg ? 900 : 520
      const capture = idx
      setTimeout(() => {
        if (isLeg) setLegendaryFlash(true)
        setFlipped(prev => [...prev, capture])
        idx++
        flipNext()
      }, delay)
    }
    flipNext()
  }, [])

  const handlePick = (def) => {
    if (done || !allFlipped) return
    setPicked(def)
    setDone(true)
    setTimeout(() => onPick(def), 600)
  }

  const handleCoins = () => {
    if (done) return
    setDone(true)
    setTimeout(() => onTakeCoins?.(), 400)
  }

  return (
    <div className={`pack-overlay ${legendaryFlash ? 'pack-overlay--legendary-flash' : ''}`}>
      <div className="pack-overlay-panel">
        <div className="poh-bar" style={{ background: pack.iconBg }}>
          <span className="poh-icon">{pack.icon}</span>
          <div className="poh-text">
            <div className="poh-title">{pack.label}</div>
            <div className="poh-desc">{pack.desc}</div>
          </div>
        </div>

        <div className="poc-grid">
          {drawnCards.map((def, i) => {
            const isFlipped = flipped.includes(i)
            const isSelected = picked === def
            const card = defToCard(def)
            return (
              <div
                key={i}
                className={`poc-slot ${isFlipped ? 'poc-slot--flipped' : ''} ${isSelected ? 'poc-slot--picked' : ''} ${isFlipped && def.rarity === 'legendary' ? 'poc-slot--legendary' : ''}`}
                onClick={() => handlePick(def)}
              >
                <div className="poc-inner">
                  <div className="poc-back">
                    <img className="poc-back-logo" src="/logo.png" alt="GOAL TCG" onError={e => { e.target.style.display = 'none' }} />
                  </div>
                  <div className="poc-front">
                    <FieldCard card={card} fieldSize />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!allFlipped && <div className="poc-hint">Odkrywanie kart...</div>}

        {allFlipped && !done && (
          <div className="pack-actions">
            <p className="pack-prompt">Dotknij kartę aby dodać do kolekcji</p>
            {onTakeCoins && (
              <button className="pack-coins-btn" onClick={handleCoins}>
                + {PACK_REFUND} MONET ZAMIAST KARTY
              </button>
            )}
          </div>
        )}

        {done && (
          <div className="pack-done">
            {picked ? `✓ Dodano ${picked.name} do kolekcji!` : `+ Otrzymano ${PACK_REFUND} monet!`}
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
          <span className="ar-icon">{isGem ? '💎' : '+'}</span>
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
    { id: 'price', label: 'Cena ↓' },
  ]

  return (
    <div className="sell-tab">
      {sellableCards.length === 0 ? (
        <div className="market-empty">
          <div className="market-empty-icon">◎</div>
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
                    <div className="sr-price">+ {def.sellPrice}</div>
                  </div>
                  {isSelected && (
                    <button
                      className="si-sell-btn"
                      onClick={e => {
                        e.stopPropagation()
                        sellCard(owned.instanceId)
                        showNotif(`Sprzedano ${def.name} za ${def.sellPrice} monet`, true)
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
        <div className="shop-title">SKLEP ZAWODNIKÓW</div>
        <div className="shop-refresh">{secsLeft > 0 ? `Odświeżenie za ${fmtTime(secsLeft)}` : 'Odświeżanie...'}</div>
      </div>
      {shopCards.length === 0 ? (
        <div className="market-empty">
          <div className="market-empty-icon">◈</div>
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
                  <div className="shop-row-price">+ {price}</div>
                  <button
                    className={`shop-buy-btn ${!canAfford ? 'shop-buy-btn--locked' : ''}`}
                    disabled={!canAfford}
                    onClick={() => { buyShopCard(def.id); showNotif(`✓ ${def.name} kupiony!`) }}
                  >
                    KUP
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="shop-hint">▸ 3 zawodników zmienia się co 12h • cena = 2× wartość sprzedaży</div>
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
      if (profile.coins < pack.cost) { showNotif('Za mało monet!', false); return }
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
    showNotif(`★ ${def.name}${isFree ? ' + 30 monet' : ''} dodany do kolekcji!`)
  }

  const handleTakeCoins = () => {
    addCoins(PACK_REFUND)
    setOpeningPack(null)
    showNotif(`+ ${PACK_REFUND} monet!`)
  }

  const handleWatchAd = () => {
    if (adSecsLeft > 0) {
      showNotif(`○ Następna reklama za ${fmtCountdown(adSecsLeft)}`, false)
      return
    }
    showNotif('▶ Oglądasz reklamę...', true)
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
      showNotif(`○ Następna paczka za ${fmtCountdown(freePackSecsLeft)}`, false)
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
          PACZKI
        </button>
        <button className={`market-tab ${tab === 'shop' ? 'market-tab--active' : ''}`} onClick={() => setTab('shop')}>
          SKLEP
        </button>
        <button className={`market-tab ${tab === 'sell' ? 'market-tab--active' : ''}`} onClick={() => setTab('sell')}>
          SPRZEDAJ
        </button>
      </div>

      {tab === 'shop' ? (
        <ShopTab profile={profile} refreshCardShop={refreshCardShop} buyShopCard={buyShopCard} showNotif={showNotif} />
      ) : tab === 'packs' ? (
        <div className="packs-list">

          {/* Ad banner */}
          <div className={`ad-banner ${adSecsLeft > 0 ? 'ad-banner--cooldown' : ''}`} onClick={handleWatchAd}>
            <div className="ad-play-wrap">
              <span className="ad-play-icon">▶</span>
            </div>
            <div className="ad-body">
              <div className="ad-title">OBEJRZYJ <span className="ad-kw">REKLAMĘ</span></div>
              <div className="ad-reward-row">
                <span className="ad-rew-coin">+50 monet</span>
                <span className="ad-rew-sep">LUB</span>
                <span className="ad-rew-gem">+1 💎</span>
              </div>
              <div className="ad-desc">
                {adSecsLeft > 0 ? `Dostępna za ${fmtCountdown(adSecsLeft)}` : 'Darmowa nagroda czeka!'}
              </div>
            </div>
            <div className="ad-visual">
              <img className="ad-visual-img" src="/market/ad-reward.png" alt="" onError={e => { e.target.style.display = 'none' }} />
            </div>
          </div>

          {/* Featured row: Free Pack + Premium side by side */}
          <div className="featured-row">
            <div className={`fp-card ${freePackSecsLeft > 0 ? 'fp-card--cooldown' : ''}`} onClick={handleClaimFreePack}>
              <div className="fp-top">
                <img className="fp-bag-img" src="/packs/pack-free.png" alt="Darmowa paczka" onError={e => { e.target.style.display='none' }} />
                <div className="fp-card-body">
                  <div className="fp-badge">FREE</div>
                  <div className="fp-card-title">DARMOWA PACZKA</div>
                  <div className="fp-card-desc">Codzienna paczka zawodników.</div>
                </div>
              </div>
              {freePackSecsLeft > 0 && <div className="fp-timer">○ {fmtCountdown(freePackSecsLeft)}</div>}
              <button className={`fp-card-btn ${freePackSecsLeft > 0 ? 'fp-card-btn--wait' : ''}`}>
                {freePackSecsLeft > 0 ? 'NIEDOSTĘPNA' : 'ODBIERZ'}
              </button>
            </div>

            {(() => {
              const prem = PACKS.find(p => p.id === 'premium')
              const canAfford = gems >= prem.cost
              return (
                <div className="prem-card">
                  <div className="prem-top">
                    <img className="prem-bag-img" src="/packs/pack-premium.png" alt="Paczka Premium" onError={e => { e.target.style.display='none' }} />
                    <div className="prem-card-info">
                      <div className="prem-card-badge">💎 PREMIUM</div>
                      <div className="prem-card-name">PACZKA PREMIUM</div>
                      <div className="prem-card-desc">5 kart • Gwarantowana Legenda!</div>
                    </div>
                  </div>
                  <button
                    className={`prem-btn prem-btn--gem${!canAfford ? ' prem-btn--locked' : ''}`}
                    onClick={() => handleBuyPack(prem)}
                  >
                    💎 {prem.cost}
                  </button>
                </div>
              )
            })()}
          </div>

          {/* Section label */}
          <div className="packs-section-label">
            <span className="psl-text">📦 PACZKI ZAWODNIKÓW</span>
            <div className="psl-line" />
          </div>

          {/* 3-column pack grid */}
          <div className="packs-grid">
            {(() => {
              const nameMap = { random:'LOSOWA', attack:'ATAK', defense:'OBRONA', midfield:'ŚRODEK', gk:'BRAMKARZ', mega:'MEGA' }
              const descMap = {
                random: 'Losowa paczka zawodników.',
                attack: 'Zawodnicy specjalizujący się w ataku.',
                defense: 'Zawodnicy wzmacniający obronę.',
                midfield: 'Kontrola środka pola i rozgrywki.',
                gk: 'Bramkarze o niezwykłych refleksach.',
                mega: 'Więcej kart, większe szanse na legendy!',
              }
              return PACKS.filter(p => p.currency === 'coins').map(pack => {
                const canAffordCoins = profile.coins >= pack.cost
                const canAffordGems = gems >= pack.gemCost
                const cardCount = pack.id === 'mega' ? '5 kart' : '3 karty'
                return (
                  <div key={pack.id} className={`pack-card pack-card--${pack.id}`}>
                    {pack.id === 'mega' && <div className="pack-card-best-badge">NAJLEPSZA WARTOŚĆ!</div>}
                    <div className="pc-main">
                      <div className="pc-img-col">
                        <img className="pc-bag-img" src={`/packs/pack-${pack.id}.png`} alt={pack.label} onError={e => { e.target.style.display = 'none' }} />
                      </div>
                      <div className="pc-text-col">
                        <div className="pc-name">{nameMap[pack.id] || pack.label}</div>
                        <div className="pc-karta-count">{cardCount}</div>
                        <div className="pc-short-desc">{descMap[pack.id]}</div>
                      </div>
                    </div>
                    <div className="pc-actions">
                      <button className={`pc-buy-coin${!canAffordCoins ? ' pc-buy--locked' : ''}`} onClick={() => handleBuyPack(pack, false)}>
                        🪙 {pack.cost}
                      </button>
                      <button className={`pc-buy-gem${!canAffordGems ? ' pc-buy--locked' : ''}`} onClick={() => handleBuyPack(pack, true)}>
                        💎 {pack.gemCost}
                      </button>
                    </div>
                  </div>
                )
              })
            })()}
          </div>

          {/* Special offers */}
          <div className="packs-section-label">
            <span className="psl-text">★ OFERTY SPECJALNE</span>
            <div className="psl-line" />
            <div className="offers-timer-badge">○ KOŃCZY SIĘ ZA: 2D 12H</div>
          </div>
          <div className="starter-pack-card">
            <div className="sp-top-badge">★ JEDNORAZOWA OFERTA</div>
            <div className="sp-body">
              <div className="sp-img-col">
                <img className="sp-bag-img" src="/packs/pack-random.png" alt="Pakiet Startowy" onError={e => { e.target.style.display='none' }} />
                <div className="sp-x5-badge">×5</div>
              </div>
              <div className="sp-content">
                <div className="sp-name">PAKIET STARTOWY</div>
                <div className="sp-tagline">Idealny start dla każdego menedżera!</div>
                <div className="sp-reward-row">
                  <div className="sp-chip">+ <b>10 000</b> M</div>
                  <div className="sp-chip sp-chip--gem">💎 <b>200</b></div>
                  <div className="sp-chip sp-chip--pack">📦 <b>5×</b></div>
                </div>
              </div>
              <button className="sp-price-btn" disabled>
                <div className="sp-price-amount">19,99 zł</div>
                <div className="sp-price-label">JEDNORAZOWA OFERTA</div>
              </button>
            </div>
          </div>

          <div className="packs-footer">ⓘ Karty są dodawane do Twojej kolekcji od razu po zakupie.</div>
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
