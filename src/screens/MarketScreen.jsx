import React, { useState } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile } from '../App'
import PlayerCard from '../components/PlayerCard'
import { CARD_DEFINITIONS } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import './MarketScreen.css'

const MARKET_CARDS = CARD_DEFINITIONS.filter(d => d.marketPrice > 0)

function buildMarketCard(def) {
  return {
    ...def,
    instanceId: `market_${def.id}`,
    currentAttackStat: def.attackStat,
    currentDefenseStat: def.defenseStat,
    upgradeLevel: 0,
  }
}

export default function MarketScreen() {
  const { goBack } = useRouter()
  const { profile, buyCard, sellCard } = useProfile()
  const [tab, setTab] = useState('buy') // 'buy' | 'sell'
  const [selected, setSelected] = useState(null)
  const [notification, setNotification] = useState(null)

  const showNotif = (msg, ok) => {
    setNotification({ msg, ok })
    setTimeout(() => setNotification(null), 2500)
  }

  const ownedIds = profile.ownedCards.map(c => c.cardId)

  const handleBuy = (def) => {
    if (profile.coins < def.marketPrice) {
      showNotif('Za mało monet!', false)
      return
    }
    buyCard(def)
    showNotif(`Kupiono ${def.name}!`, true)
    setSelected(null)
  }

  const handleSell = (instanceId, cardName, sellPrice) => {
    sellCard(instanceId)
    showNotif(`Sprzedano ${cardName} za ${sellPrice} 🪙`, true)
    setSelected(null)
  }

  const sellableCards = profile.ownedCards
    .filter(o => !o.isStarter)
    .map(o => {
      const def = CARD_DEFINITIONS.find(d => d.id === o.cardId) || STARTER_CARD_DEFINITIONS.find(d => d.id === o.cardId)
      if (!def) return null
      const bonus = (o.upgradeLevel || 0) * (def.upgradeStatBonus || 1)
      return {
        owned: o,
        def,
        card: {
          ...def,
          instanceId: o.instanceId,
          currentAttackStat: def.attackStat + bonus,
          currentDefenseStat: def.defenseStat + bonus,
          upgradeLevel: o.upgradeLevel || 0,
        },
      }
    })
    .filter(Boolean)

  return (
    <div className="market-screen">
      <div className="market-header">
        <button className="back-btn" onClick={goBack}>←</button>
        <h1 className="market-title">Rynek Transferowy</h1>
        <div className="market-coins">🪙 {profile.coins}</div>
      </div>

      <div className="market-tabs">
        <button className={`market-tab ${tab === 'buy' ? 'market-tab--active' : ''}`} onClick={() => setTab('buy')}>
          💰 Kup
        </button>
        <button className={`market-tab ${tab === 'sell' ? 'market-tab--active' : ''}`} onClick={() => setTab('sell')}>
          📤 Sprzedaj
        </button>
      </div>

      {tab === 'buy' ? (
        <div className="market-grid">
          {MARKET_CARDS.map(def => {
            const alreadyOwned = ownedIds.includes(def.id)
            const card = buildMarketCard(def)
            const isSelected = selected === def.id
            return (
              <div
                key={def.id}
                className={`market-item ${isSelected ? 'market-item--selected' : ''} ${alreadyOwned ? 'market-item--owned' : ''}`}
                onClick={() => setSelected(prev => prev === def.id ? null : def.id)}
              >
                <PlayerCard card={card} size="small" />
                <div className="market-item-price">
                  <span className="price-val">{def.marketPrice} 🪙</span>
                  {alreadyOwned && <span className="price-owned">Posiadasz</span>}
                </div>
                {isSelected && (
                  <button
                    className={`market-buy-btn ${profile.coins < def.marketPrice ? 'market-buy-btn--disabled' : ''}`}
                    onClick={e => { e.stopPropagation(); handleBuy(def) }}
                    disabled={profile.coins < def.marketPrice}
                  >
                    Kup
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="market-grid">
          {sellableCards.length === 0 ? (
            <div className="market-empty">
              <p>Nie masz kart do sprzedania.</p>
              <p>Karty startowe nie mogą być sprzedane.</p>
            </div>
          ) : (
            sellableCards.map(({ owned, def, card }) => {
              const isSelected = selected === owned.instanceId
              return (
                <div
                  key={owned.instanceId}
                  className={`market-item ${isSelected ? 'market-item--selected' : ''}`}
                  onClick={() => setSelected(prev => prev === owned.instanceId ? null : owned.instanceId)}
                >
                  <PlayerCard card={card} size="small" />
                  <div className="market-item-price">
                    <span className="price-val price-val--sell">{def.sellPrice} 🪙</span>
                    {(owned.upgradeLevel || 0) > 0 && <span className="price-owned">+{owned.upgradeLevel} lvl</span>}
                  </div>
                  {isSelected && (
                    <button
                      className="market-sell-btn"
                      onClick={e => { e.stopPropagation(); handleSell(owned.instanceId, def.name, def.sellPrice) }}
                    >
                      Sprzedaj
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {notification && (
        <div className={`market-notif ${notification.ok ? 'market-notif--ok' : 'market-notif--err'}`}>
          {notification.msg}
        </div>
      )}
    </div>
  )
}
