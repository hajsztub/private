import { useState, useCallback } from 'react'
import { STARTER_CARDS, STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import { CARD_DEFINITIONS } from '../data/cards'

const ALL_CARD_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

const STORAGE_KEY = 'football_cards_v2'

function defaultProfile() {
  return {
    name: 'Gracz',
    rating: 1000,
    wins: 0,
    draws: 0,
    losses: 0,
    coins: 300,
    gems: 3,
    hasSeenTutorial: false,
    ownedCards: [...STARTER_CARDS],
    activeDeck: STARTER_CARDS.map(c => c.instanceId), // all starters in deck
    matchHistory: [],
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProfile()
    const parsed = JSON.parse(raw)
    // Merge with defaults for new fields added in updates
    return { ...defaultProfile(), ...parsed }
  } catch {
    return defaultProfile()
  }
}

export function usePersistentStore() {
  const [state, setState] = useState(loadState)

  const update = useCallback((patch) => {
    setState(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage full or unavailable - ignore
      }
      return next
    })
  }, [])

  const addCoins = useCallback((amount) => {
    update(prev => ({ ...prev, coins: Math.max(0, prev.coins + amount) }))
  }, [update])

  const spendCoins = useCallback((amount) => {
    update(prev => {
      if (prev.coins < amount) return prev
      return { ...prev, coins: prev.coins - amount }
    })
  }, [update])

  const addMatchResult = useCallback((result) => {
    // result: { type: 'win'|'draw'|'loss', matchType, score, coinsEarned, ratingChange }
    update(prev => {
      const wins = prev.wins + (result.type === 'win' ? 1 : 0)
      const draws = prev.draws + (result.type === 'draw' ? 1 : 0)
      const losses = prev.losses + (result.type === 'loss' ? 1 : 0)
      const newRating = result.matchType === 'league'
        ? Math.max(0, prev.rating + (result.ratingChange || 0))
        : prev.rating
      return {
        ...prev,
        wins,
        draws,
        losses,
        coins: prev.coins + result.coinsEarned,
        rating: newRating,
        matchHistory: [
          { ...result, date: Date.now() },
          ...prev.matchHistory.slice(0, 19),
        ],
      }
    })
  }, [update])

  const buyCard = useCallback((cardDef) => {
    update(prev => {
      if (prev.coins < cardDef.marketPrice) return prev
      const newInstance = {
        cardId: cardDef.id,
        instanceId: `owned_${cardDef.id}_${Date.now()}`,
        upgradeLevel: 0,
        isStarter: false,
      }
      return {
        ...prev,
        coins: prev.coins - cardDef.marketPrice,
        ownedCards: [...prev.ownedCards, newInstance],
      }
    })
  }, [update])

  // Add a card won from a pack (no coin cost)
  const claimPackCard = useCallback((cardDef) => {
    update(prev => ({
      ...prev,
      ownedCards: [...prev.ownedCards, {
        cardId: cardDef.id,
        instanceId: `pack_${cardDef.id}_${Date.now()}`,
        upgradeLevel: 0,
        isStarter: false,
      }],
    }))
  }, [update])

  const sellCard = useCallback((instanceId) => {
    update(prev => {
      const card = prev.ownedCards.find(c => c.instanceId === instanceId)
      if (!card || card.isStarter) return prev
      const def = ALL_CARD_DEFS.find(d => d.id === card.cardId)
      if (!def) return prev
      return {
        ...prev,
        coins: prev.coins + (def.sellPrice || 0),
        ownedCards: prev.ownedCards.filter(c => c.instanceId !== instanceId),
        activeDeck: prev.activeDeck.filter(id => id !== instanceId),
      }
    })
  }, [update])

  const upgradeCard = useCallback((instanceId) => {
    update(prev => {
      const cardIdx = prev.ownedCards.findIndex(c => c.instanceId === instanceId)
      if (cardIdx === -1) return prev
      const card = prev.ownedCards[cardIdx]
      const def = ALL_CARD_DEFS.find(d => d.id === card.cardId)
      if (!def) return prev
      const level = card.upgradeLevel || 0
      if (level >= 3) return prev
      const cost = def.upgradeCost?.[level]
      if (!cost || prev.coins < cost) return prev
      const updated = [...prev.ownedCards]
      updated[cardIdx] = { ...card, upgradeLevel: level + 1 }
      return {
        ...prev,
        coins: prev.coins - cost,
        ownedCards: updated,
      }
    })
  }, [update])

  const setActiveDeck = useCallback((deckInstanceIds) => {
    update(prev => ({ ...prev, activeDeck: deckInstanceIds }))
  }, [update])

  const markTutorialSeen = useCallback(() => {
    update(prev => ({ ...prev, hasSeenTutorial: true }))
  }, [update])

  const resetProfile = useCallback(() => {
    const fresh = defaultProfile()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    } catch {}
    setState(fresh)
  }, [])

  return {
    profile: state,
    update,
    addCoins,
    spendCoins,
    addMatchResult,
    buyCard,
    claimPackCard,
    sellCard,
    upgradeCard,
    setActiveDeck,
    markTutorialSeen,
    resetProfile,
  }
}
