import { useState, useCallback } from 'react'
import { STARTER_CARDS, STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
import { CARD_DEFINITIONS } from '../data/cards'
import { getTier } from '../data/botNames'

const ALL_CARD_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

const STORAGE_KEY = 'football_cards_v2'
const SHOP_REFRESH_MS = 12 * 60 * 60 * 1000

function getShopCardIds(seed) {
  const pool = CARD_DEFINITIONS.filter(d => d.marketPrice > 0 && d.sellPrice > 0)
  let s = (seed || 1) >>> 0
  const rand = () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5
    return (s >>> 0) / 0xffffffff
  }
  return [...pool].sort(() => rand() - 0.5).slice(0, 3).map(d => d.id)
}

// ── Daily missions ─────────────────────────────────────────────────────────

const MISSION_POOL = [
  { type: 'play_matches', target: 1, label: 'Zagraj 1 mecz',              icon: '🎮', reward: 50,  rewardType: 'coins' },
  { type: 'play_matches', target: 3, label: 'Zagraj 3 mecze',             icon: '🎮', reward: 120, rewardType: 'coins' },
  { type: 'win_matches',  target: 1, label: 'Wygraj 1 mecz',              icon: '🏆', reward: 80,  rewardType: 'coins' },
  { type: 'win_matches',  target: 2, label: 'Wygraj 2 mecze',             icon: '🏆', reward: 150, rewardType: 'coins' },
  { type: 'win_matches',  target: 3, label: 'Wygraj 3 mecze',             icon: '🏆', reward: 220, rewardType: 'coins' },
  { type: 'win_league',   target: 1, label: 'Wygraj mecz ligowy',         icon: '⭐', reward: 120, rewardType: 'coins' },
  { type: 'win_league',   target: 2, label: 'Wygraj 2 mecze ligowe',      icon: '⭐', reward: 220, rewardType: 'coins' },
  { type: 'score_goals',  target: 3, label: 'Strzel 3 gole',              icon: '⚽', reward: 80,  rewardType: 'coins' },
  { type: 'score_goals',  target: 5, label: 'Strzel 5 goli',              icon: '⚽', reward: 130, rewardType: 'coins' },
  { type: 'score_goals',  target: 8, label: 'Strzel 8 goli',              icon: '⚽', reward: 200, rewardType: 'coins' },
  { type: 'win_pro',      target: 1, label: 'Wygraj trening PRO',         icon: '🔴', reward: 200, rewardType: 'coins' },
  { type: 'clean_sheet',  target: 1, label: 'Wygraj nie tracąc gola',     icon: '🧤', reward: 160, rewardType: 'coins' },
]

// ── Weekly missions ────────────────────────────────────────────────────────

const WEEKLY_COIN_POOL = [
  { type: 'play_matches', target: 5,  label: 'Zagraj 5 meczów',            icon: '🎮', reward: 200, rewardType: 'coins' },
  { type: 'win_matches',  target: 3,  label: 'Wygraj 3 mecze',             icon: '🏆', reward: 300, rewardType: 'coins' },
  { type: 'win_matches',  target: 5,  label: 'Wygraj 5 meczów',            icon: '🏆', reward: 500, rewardType: 'coins' },
  { type: 'win_league',   target: 3,  label: 'Wygraj 3 mecze ligowe',      icon: '⭐', reward: 350, rewardType: 'coins' },
  { type: 'score_goals',  target: 15, label: 'Strzel 15 goli',             icon: '⚽', reward: 250, rewardType: 'coins' },
  { type: 'score_goals',  target: 25, label: 'Strzel 25 goli',             icon: '⚽', reward: 400, rewardType: 'coins' },
  { type: 'clean_sheet',  target: 2,  label: 'Wygraj 2× nie tracąc gola', icon: '🧤', reward: 350, rewardType: 'coins' },
]

const WEEKLY_GEM_POOL = [
  { type: 'win_league',  target: 5, label: 'Wygraj 5 meczów ligowych', icon: '⭐', reward: 2, rewardType: 'gems' },
  { type: 'win_pro',     target: 2, label: 'Wygraj 2 treningi PRO',    icon: '🔴', reward: 2, rewardType: 'gems' },
  { type: 'win_matches', target: 7, label: 'Wygraj 7 meczów',          icon: '🏆', reward: 3, rewardType: 'gems' },
]

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekStr() {
  const d = new Date()
  const day = d.getDay() || 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day - 1))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5
    return (s >>> 0) / 0xffffffff
  }
}

function generateDailyMissions(dateStr) {
  const seed = dateStr.replace(/-/g, '').split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7)
  const rand = seededRandom(seed)
  const shuffled = [...MISSION_POOL].sort(() => rand() - 0.5)
  return shuffled.slice(0, 3).map((m, i) => ({
    ...m,
    id: `${dateStr}_${i}`,
    progress: 0,
    claimed: false,
  }))
}

function applyMissionProgress(missions, result) {
  return missions.map(m => {
    if (m.claimed) return m
    let progress = m.progress
    switch (m.type) {
      case 'play_matches': progress = Math.min(m.target, progress + 1); break
      case 'win_matches':  if (result.type === 'win') progress = Math.min(m.target, progress + 1); break
      case 'win_league':   if (result.type === 'win' && result.matchType === 'league') progress = Math.min(m.target, progress + 1); break
      case 'score_goals':  progress = Math.min(m.target, progress + (result.playerGoals || 0)); break
      case 'win_pro':      if (result.type === 'win' && result.matchType === 'training_pro') progress = Math.min(m.target, progress + 1); break
      case 'clean_sheet':  if (result.type === 'win' && (result.score?.ai ?? 1) === 0) progress = Math.min(m.target, progress + 1); break
      default: break
    }
    return { ...m, progress }
  })
}

function ensureDailyMissions(profile) {
  const today = getTodayStr()
  if (!profile.dailyMissions || profile.dailyMissions.date !== today) {
    return { ...profile, dailyMissions: { date: today, missions: generateDailyMissions(today) } }
  }
  return profile
}

function generateWeeklyMissions(weekStr) {
  const seed = weekStr.replace(/-/g, '').split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 13)
  const rand = seededRandom(seed)
  const shuffledCoins = [...WEEKLY_COIN_POOL].sort(() => rand() - 0.5).slice(0, 3)
  const gemMission = WEEKLY_GEM_POOL[Math.floor(rand() * WEEKLY_GEM_POOL.length)]
  return [...shuffledCoins, gemMission]
    .sort(() => rand() - 0.5)
    .map((m, i) => ({ ...m, id: `w_${weekStr}_${i}`, progress: 0, claimed: false }))
}

function ensureWeeklyMissions(profile) {
  const week = getWeekStr()
  if (!profile.weeklyMissions || profile.weeklyMissions.week !== week) {
    return { ...profile, weeklyMissions: { week, missions: generateWeeklyMissions(week) } }
  }
  return profile
}

function defaultProfile() {
  return {
    name: 'Gracz',
    rating: 1000,
    wins: 0,
    draws: 0,
    losses: 0,
    coins: 600,
    gems: 5,
    hasSeenTutorial: false,
    hasClaimedFirstWinReward: false,
    hasSetupProfile: false,
    lastAdWatchedAt: 0,
    lastFreePackAt: 0,
    ownedCards: [...STARTER_CARDS],
    activeDeck: STARTER_CARDS.map(c => c.instanceId),
    deckAssignments: null, // { slotId: instanceId } — exact formation layout
    matchHistory: [],
    injuries: {}, // { instanceId: timestampUntilHealed }
    dailyMissions: { date: '', missions: [] },
    weeklyMissions: { week: '', missions: [] },
    cardShop: { cardIds: [], refreshedAt: 0 },
    lastTierChange: null, // { from, to, timestamp }
    notifications: [], // [{ id, type, message, timestamp, read }]
  }
}

const NEW_STARTER_IDS = ['starter_def4', 'starter_mid4', 'starter_atk4']

function migrateProfile(profile) {
  const ownedIds = new Set(profile.ownedCards.map(c => c.instanceId))
  const missing = NEW_STARTER_IDS.filter(id => !ownedIds.has(id))
  if (missing.length === 0) return profile
  const newCards = missing.map(id => ({ cardId: id, instanceId: id, upgradeLevel: 0, isStarter: true }))
  return { ...profile, ownedCards: [...profile.ownedCards, ...newCards] }
}

function loadState() {
  const ensureAll = p => ensureWeeklyMissions(ensureDailyMissions(p))
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return ensureAll(defaultProfile())
    const parsed = JSON.parse(raw)
    return ensureAll(migrateProfile({ ...defaultProfile(), ...parsed }))
  } catch {
    return ensureAll(defaultProfile())
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

  const addInjuries = useCallback((entries) => {
    // entries: [{ instanceId, until }]
    update(prev => ({
      ...prev,
      injuries: {
        ...prev.injuries,
        ...Object.fromEntries(entries.map(e => [e.instanceId, e.until])),
      },
    }))
  }, [update])

  const addMatchResult = useCallback((result) => {
    // result: { type, matchType, score, coinsEarned, ratingChange, playerGoals, mvpName }
    update(prev => {
      const wins = prev.wins + (result.type === 'win' ? 1 : 0)
      const draws = prev.draws + (result.type === 'draw' ? 1 : 0)
      const losses = prev.losses + (result.type === 'loss' ? 1 : 0)
      const newRating = result.matchType === 'league'
        ? Math.max(0, prev.rating + (result.ratingChange || 0))
        : prev.rating

      const oldTier = getTier(prev.rating)
      const newTier = getTier(newRating)
      const lastTierChange = (result.matchType === 'league' && oldTier.id !== newTier.id)
        ? { from: oldTier.id, to: newTier.id, timestamp: Date.now() }
        : prev.lastTierChange

      const today = getTodayStr()
      const dm = (prev.dailyMissions?.date === today)
        ? prev.dailyMissions
        : { date: today, missions: generateDailyMissions(today) }
      const dailyMissions = { ...dm, missions: applyMissionProgress(dm.missions, result) }

      const week = getWeekStr()
      const wm = (prev.weeklyMissions?.week === week)
        ? prev.weeklyMissions
        : { week, missions: generateWeeklyMissions(week) }
      const weeklyMissions = { ...wm, missions: applyMissionProgress(wm.missions, result) }

      return {
        ...prev,
        wins, draws, losses,
        coins: prev.coins + result.coinsEarned,
        rating: newRating,
        dailyMissions,
        weeklyMissions,
        lastTierChange,
        matchHistory: [
          { ...result, date: Date.now() },
          ...prev.matchHistory.slice(0, 19),
        ],
      }
    })
  }, [update])

  const claimMission = useCallback((missionId) => {
    update(prev => {
      const dm = prev.dailyMissions
      if (!dm) return prev
      const mission = dm.missions.find(m => m.id === missionId)
      if (!mission || mission.claimed || mission.progress < mission.target) return prev
      return {
        ...prev,
        coins: prev.coins + mission.reward,
        dailyMissions: {
          ...dm,
          missions: dm.missions.map(m => m.id === missionId ? { ...m, claimed: true } : m),
        },
      }
    })
  }, [update])

  const claimWeeklyMission = useCallback((missionId) => {
    update(prev => {
      const wm = prev.weeklyMissions
      if (!wm) return prev
      const mission = wm.missions.find(m => m.id === missionId)
      if (!mission || mission.claimed || mission.progress < mission.target) return prev
      const updated = {
        ...prev,
        weeklyMissions: { ...wm, missions: wm.missions.map(m => m.id === missionId ? { ...m, claimed: true } : m) },
      }
      return mission.rewardType === 'gems'
        ? { ...updated, gems: prev.gems + mission.reward }
        : { ...updated, coins: prev.coins + mission.reward }
    })
  }, [update])

  const clearNotifications = useCallback(() => {
    update(prev => ({ ...prev, notifications: [] }))
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
      const newAssignments = prev.deckAssignments
        ? Object.fromEntries(
            Object.entries(prev.deckAssignments).map(([k, v]) => [k, v === instanceId ? null : v])
          )
        : null
      return {
        ...prev,
        coins: prev.coins + (def.sellPrice || 0),
        ownedCards: prev.ownedCards.filter(c => c.instanceId !== instanceId),
        activeDeck: prev.activeDeck.filter(id => id !== instanceId),
        deckAssignments: newAssignments,
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

  const setActiveDeck = useCallback((deckInstanceIds, assignments) => {
    update(prev => ({
      ...prev,
      activeDeck: deckInstanceIds,
      deckAssignments: assignments ?? prev.deckAssignments,
    }))
  }, [update])

  const markTutorialSeen = useCallback(() => {
    update(prev => ({ ...prev, hasSeenTutorial: true }))
  }, [update])

  const claimFirstWinReward = useCallback(() => {
    update(prev => ({
      ...prev,
      hasClaimedFirstWinReward: true,
      coins: prev.coins + 200,
    }))
  }, [update])

  const markProfileSetup = useCallback((name) => {
    update(prev => ({ ...prev, name: name || prev.name, hasSetupProfile: true }))
  }, [update])

  const recordAdWatched = useCallback(() => {
    update(prev => ({ ...prev, lastAdWatchedAt: Date.now() }))
  }, [update])

  const recordFreePackClaimed = useCallback(() => {
    update(prev => ({ ...prev, lastFreePackAt: Date.now() }))
  }, [update])

  const refreshCardShop = useCallback(() => {
    update(prev => {
      const now = Date.now()
      if (now - (prev.cardShop?.refreshedAt || 0) < SHOP_REFRESH_MS && prev.cardShop?.cardIds?.length) return prev
      return { ...prev, cardShop: { cardIds: getShopCardIds(now), refreshedAt: now } }
    })
  }, [update])

  const buyShopCard = useCallback((cardId) => {
    update(prev => {
      const def = CARD_DEFINITIONS.find(d => d.id === cardId)
      if (!def) return prev
      const price = (def.sellPrice || 0) * 2
      if (prev.coins < price) return prev
      return {
        ...prev,
        coins: prev.coins - price,
        ownedCards: [...prev.ownedCards, {
          cardId: def.id,
          instanceId: `shop_${def.id}_${Date.now()}`,
          upgradeLevel: 0,
          isStarter: false,
        }],
      }
    })
  }, [update])

  const clearTierChange = useCallback(() => {
    update(prev => ({ ...prev, lastTierChange: null }))
  }, [update])

  const addNotifications = useCallback((notifs) => {
    update(prev => {
      const existingIds = new Set((prev.notifications || []).map(n => n.id))
      const fresh = notifs.filter(n => !existingIds.has(n.id))
      if (!fresh.length) return prev
      return {
        ...prev,
        notifications: [...fresh, ...(prev.notifications || [])].slice(0, 50),
      }
    })
  }, [update])

  const markNotificationsRead = useCallback(() => {
    update(prev => ({
      ...prev,
      notifications: (prev.notifications || []).map(n => ({ ...n, read: true })),
    }))
  }, [update])

  const dismissNotification = useCallback((id) => {
    update(prev => ({
      ...prev,
      notifications: (prev.notifications || []).filter(n => n.id !== id),
    }))
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
    addInjuries,
    claimMission,
    buyCard,
    claimPackCard,
    sellCard,
    upgradeCard,
    setActiveDeck,
    markTutorialSeen,
    claimFirstWinReward,
    markProfileSetup,
    recordAdWatched,
    recordFreePackClaimed,
    refreshCardShop,
    buyShopCard,
    clearTierChange,
    claimWeeklyMission,
    clearNotifications,
    addNotifications,
    markNotificationsRead,
    dismissNotification,
    resetProfile,
  }
}
