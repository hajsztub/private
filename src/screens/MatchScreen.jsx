import React, { useReducer, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile, useSettings } from '../App'
import {
  createMatchState, gameReducer, selectGoalkeeper,
  endTurn, canPlaceInSector, MAX_SECTOR_SIZE,
} from '../game/gameEngine'
import { runAITurn, pickAIGoalkeeper } from '../game/aiEngine'
import { computeRewardCoins, computeRatingChange, determinePlayerOfMatch } from '../game/scoreEngine'
import { createDeckFromOwned, CARD_DEFINITIONS, createDefaultDeck, createBalancedAIDeck, createWeakerAIDeck, createEliteAIDeck } from '../data/cards'
import { STARTER_CARD_DEFINITIONS, createStarterAIDeck } from '../data/starterRoster'
import { SFX } from '../game/soundEngine'
import FieldCard, { GKCard } from '../components/FieldCard'
import GoalAnimation from '../components/GoalAnimation'
import CoinFlip from '../components/CoinFlip'
import { SpecialCardModal } from '../components/SpecialCardModal'
import './MatchScreen.css'

const ALL_CARD_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

function buildPlayerDeck(profile) {
  const deckIds = profile.activeDeck || profile.ownedCards.map(c => c.instanceId)
  const deckCards = profile.ownedCards.filter(c => deckIds.includes(c.instanceId))
  return createDeckFromOwned(deckCards, ALL_CARD_DEFS)
}

// ── Card Zoom Modal ────────────────────────────────────────────────────────

function CardZoomModal({ card, isPlayerField, canActivate, onActivate, onSubstitute, onClose, placements }) {
  if (!card) return null
  const atkVal = card.currentAttackStat ?? card.attackStat ?? 0
  const defVal = card.currentDefenseStat ?? card.defenseStat ?? 0
  const baseAtk = card.attackStat ?? 0
  const baseDef = card.defenseStat ?? 0
  const atkDelta = atkVal - baseAtk
  const defDelta = defVal - baseDef
  const TYPE_LABEL = { attack: 'Napastnik', midfield: 'Pomocnik', defense: 'Obrońca', goalkeeper: 'Bramkarz' }
  const RARITY_LABEL = { common: 'Normalny', rare: 'Rzadki', legendary: 'Legendarny ★', starter: 'Starter' }
  const RARITY_C = { common: '#9e9e9e', rare: '#ff9800', legendary: '#ffd700', starter: '#607d8b' }

  return (
    <div className="zoom-backdrop" onClick={onClose}>
      <div className="zoom-panel" onClick={e => e.stopPropagation()}>
        <div className="zoom-avatar" style={{ background: `linear-gradient(160deg, ${card.color || '#1a2a1a'}, #07090e)` }}>
          <img
            className="zoom-avatar-img"
            src={`/avatars/${card.id}.png`}
            alt=""
            onError={e => { e.target.style.display = 'none' }}
            draggable={false}
          />
        </div>

        <div className="zoom-meta-row">
          <div className="zoom-type-badge">{card.typeLabel} — {TYPE_LABEL[card.type] || card.type}</div>
          <div className="zoom-rarity" style={{ color: RARITY_C[card.rarity] }}>
            {RARITY_LABEL[card.rarity] || card.rarity}
          </div>
        </div>

        <div className="zoom-name">{card.name}</div>

        <div className="zoom-stats-row">
          <div className="zoom-stat">
            <span className="zs-label">ATK</span>
            <span className="zs-val zs-val--atk">{atkVal}</span>
            {atkDelta !== 0 && (
              <span className={`zs-delta ${atkDelta > 0 ? 'zs-delta--up' : 'zs-delta--down'}`}>
                {atkDelta > 0 ? '+' : ''}{atkDelta}
              </span>
            )}
          </div>
          <div className="zoom-stat">
            <span className="zs-label">DEF</span>
            <span className="zs-val zs-val--def">{defVal}</span>
            {defDelta !== 0 && (
              <span className={`zs-delta ${defDelta > 0 ? 'zs-delta--up' : 'zs-delta--down'}`}>
                {defDelta > 0 ? '+' : ''}{defDelta}
              </span>
            )}
          </div>
          {card.upgradeLevel > 0 && (
            <div className="zoom-stat">
              <span className="zs-label">LVL</span>
              <span className="zs-val" style={{ color: '#ffd54f' }}>+{card.upgradeLevel}</span>
            </div>
          )}
        </div>
        {(atkDelta < 0 || defDelta < 0) && (
          <div className="zoom-debuff-hint">
            ⚠ Statystyki obniżone przez efekty kart — sprawdź dziennik (ℹ)
          </div>
        )}

        <div className="zoom-ability">
          <div className="zoom-ability-name">{card.abilityName}</div>
          <div className="zoom-ability-type">
            {card.abilityType === 'passive' ? '🔵 PASYWNA'
              : card.abilityType === 'active_coin' ? '🟡 AKTYWNA (rzut żetonem)'
              : '🟢 AKTYWNA'}
          </div>
          <div className="zoom-ability-desc">{card.abilityDescription}</div>
          {card.abilityType === 'active_coin' && (
            <div className="zoom-coin-outcomes">
              <div className="zoom-coin-ball">⚽ <b>Piłka:</b> {card.activationEffect?.ball?.message || '—'}</div>
              <div className="zoom-coin-glove">🧤 <b>Rękawica:</b> {card.activationEffect?.glove?.message || '—'}</div>
            </div>
          )}
          {card.noActivationDescription && card.abilityType !== 'passive' && (
            <div className="zoom-noact">
              <span className="zoom-noact-lbl">Brak aktywacji: </span>
              {card.noActivationDescription}
            </div>
          )}
        </div>

        {isPlayerField && (
          <div className="zoom-field-actions">
            {canActivate && card.abilityType !== 'passive' && !card.isLocked && !card.justPlaced && (
              <button className="zoom-act-btn zoom-act-btn--activate" onClick={onActivate}>
                ⚡ Aktywuj umiejętność
              </button>
            )}
            {onSubstitute && (
              <button className="zoom-act-btn zoom-act-btn--sub" onClick={onSubstitute}>
                🔄 Zmiana (wróć na ławkę)
              </button>
            )}
          </div>
        )}

        {placements && placements.length > 0 && (
          <div className="zoom-field-actions">
            {placements.map((p, i) => (
              <button key={i} className="zoom-act-btn zoom-act-btn--place" onClick={p.onClick}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        <button className="zoom-close" onClick={onClose}>✕ Zamknij</button>
      </div>
    </div>
  )
}

// ── Match Log Panel ────────────────────────────────────────────────────────

const LOG_TYPE_META = {
  buff:    { color: '#66bb6a', icon: '⬆' },
  warning: { color: '#ef5350', icon: '⬇' },
  special: { color: '#ffd54f', icon: '✦' },
  action:  { color: '#64b5f6', icon: '▸' },
  info:    { color: 'rgba(255,255,255,0.4)', icon: '·' },
}

function MatchLogPanel({ log, round, onClose }) {
  const currentRound = log.filter(e => e.round === round)
  const previous = log.filter(e => e.round !== round)

  const renderEntry = (entry, i) => {
    const meta = LOG_TYPE_META[entry.type] || LOG_TYPE_META.info
    return (
      <div key={i} className="mlog-entry">
        <span className="mlog-icon" style={{ color: meta.color }}>{meta.icon}</span>
        <span className="mlog-msg" style={{ color: entry.type === 'info' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.9)' }}>
          {entry.message}
        </span>
      </div>
    )
  }

  return (
    <div className="mlog-overlay" onClick={onClose}>
      <div className="mlog-panel" onClick={e => e.stopPropagation()}>
        <div className="mlog-header">
          <span className="mlog-title">📋 Dziennik meczu</span>
          <button className="mlog-close" onClick={onClose}>✕</button>
        </div>
        <div className="mlog-body">
          {currentRound.length > 0 && (
            <>
              <div className="mlog-section-label">Runda {round} (aktualnie)</div>
              {currentRound.map(renderEntry)}
            </>
          )}
          {previous.length > 0 && (
            <>
              <div className="mlog-section-label mlog-section-label--old">Wcześniejsze rundy</div>
              {previous.map(renderEntry)}
            </>
          )}
          {log.length === 0 && (
            <div className="mlog-empty">Brak wpisów — gra właśnie się zaczęła.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Goal Posts decoration ──────────────────────────────────────────────────

function GoalPosts({ side }) {
  return (
    <div className={`goal-posts goal-posts--${side}`}>
      <svg viewBox="0 0 200 24" preserveAspectRatio="none">
        <rect x="2" y="2" width="4" height="20" fill="white" rx="2" opacity="0.8" />
        <rect x="194" y="2" width="4" height="20" fill="white" rx="2" opacity="0.8" />
        <rect x="2" y="2" width="196" height="4" fill="white" rx="2" opacity="0.8" />
        {[20,38,56,74,92,110,128,146,164,182].map(x => (
          <line key={x} x1={x} y1="6" x2={x} y2="22" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        ))}
        {[10, 16, 22].map(y => (
          <line key={y} x1="6" y1={y} x2="194" y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        ))}
      </svg>
    </div>
  )
}

// ── MatchScreen ────────────────────────────────────────────────────────────

export default function MatchScreen({ matchParams = {} }) {
  const { replace, navigate } = useRouter()
  const { profile, addMatchResult, addInjuries, addNotifications, markTutorialSeen, claimFirstWinReward } = useProfile()
  const { settings } = useSettings()

  const matchType = matchParams.matchType || 'local'
  const opponentName = matchParams.opponentName || 'BOT'

  const [matchState, dispatch] = useReducer(gameReducer, null, () => {
    const playerDeck = buildPlayerDeck(profile)
    const amateurMatchesPlayed = (profile.matchHistory || []).filter(m => m.matchType === 'training_amateur').length
    const aiDeck =
      matchType === 'league'           ? createBalancedAIDeck(playerDeck) :
      matchType === 'training_amateur' ? (amateurMatchesPlayed < 2 ? createStarterAIDeck() : createWeakerAIDeck(playerDeck)) :
      matchType === 'training_pro'     ? createEliteAIDeck() :
                                         createDefaultDeck('B')
    return createMatchState(matchType, playerDeck, aiDeck)
  })

  const [tutStep, setTutStep] = useState(profile.hasSeenTutorial ? null : 0)
  const [firstWinReward, setFirstWinReward] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [goalAnim, setGoalAnim] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [zoomCard, setZoomCard] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [prematchLoading, setPrematchLoading] = useState(false)
  const [incompleteMsg, setIncompleteMsg] = useState(null)
  const [notification, setNotification] = useState(null)
  const [showForfeit, setShowForfeit] = useState(false)
  const [showRedrawConfirm, setShowRedrawConfirm] = useState(false)
  const [goalsCollapsed, setGoalsCollapsed] = useState(false)
  const [handCollapsed, setHandCollapsed] = useState(false)
  const [showDeckPopup, setShowDeckPopup] = useState(false)
  const [turnSecsLeft, setTurnSecsLeft] = useState(45)
  const deckBadgeRef = useRef(null)
  const handleEndTurnRef = useRef(null)

  const handleEndTurn = useCallback(() => {
    if (matchState.currentPlayer !== 'A' || matchState.coinFlipState?.pending) return
    SFX.endTurn()
    dispatch({ type: 'END_TURN' })
    setSelectedCard(null)
  }, [matchState])

  // ── Drag + double-tap state ───────────────────────────────────────────────
  const dragRef = useRef(null)
  const lastTapRef = useRef({})
  const [dragPos, setDragPos] = useState(null)
  const [dragZone, setDragZone] = useState(null)

  // ── GK setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'goalkeeper_selection') return
    if (!matchState.players.A.activeGoalkeeper || matchState.players.B.activeGoalkeeper) return
    const aiGK = pickAIGoalkeeper(matchState.players.B.goalkeepers)
    setTimeout(() => dispatch({ type: 'SELECT_GOALKEEPER', playerId: 'B', gkInstanceId: aiGK.instanceId }), 500)
  }, [matchState.phase, matchState.players.A.activeGoalkeeper, matchState.players.B.activeGoalkeeper])

  useEffect(() => {
    if (matchState.phase === 'playing' && matchState.round === 1) SFX.matchStart()
  }, [matchState.phase])

  // ── Blocked turn (block_opponent_turn passive) ────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'playing') return
    if (matchState.skipTurn !== matchState.currentPlayer) return
    const t = setTimeout(() => dispatch({ type: 'END_TURN' }), 800)
    return () => clearTimeout(t)
  }, [matchState.skipTurn, matchState.currentPlayer, matchState.phase])

  // ── AI turn ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'playing' || matchState.currentPlayer !== 'B' || aiThinking) return
    if (matchState.skipTurn === 'B') return // handled by blocked-turn effect
    const t = setTimeout(() => runAITurn(matchState, dispatch, setAiThinking), 400)
    return () => clearTimeout(t)
  }, [matchState.currentPlayer, matchState.phase, matchState.round])

  // ── Game end ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'ended') return
    const score = matchState.displayScore
    const result = score.player > score.ai ? 'win' : score.ai > score.player ? 'loss' : 'draw'
    const coins = computeRewardCoins(result, matchType, Math.abs(score.player - score.ai))
    const ratingChange = computeRatingChange(result, matchType)
    const playerOfMatch = determinePlayerOfMatch(matchState.goalEvents,
      { offense: matchState.players.A.offenseSector, defense: matchState.players.A.defenseSector }, {})
    if (result === 'win') SFX.matchEnd()
    addMatchResult({ type: result, matchType, score, coinsEarned: coins, ratingChange, playerGoals: score.player, mvpName: playerOfMatch?.name || null })
    // Injury roll: 8% chance per field card
    const fieldCards = [
      ...matchState.players.A.offenseSector,
      ...matchState.players.A.defenseSector,
    ].filter(c => !c.isDestroyed && c.instanceId)
    const injuredEntries = fieldCards
      .filter(() => Math.random() < 0.08)
      .map(c => ({ instanceId: c.instanceId, until: Date.now() + (2 + Math.floor(Math.random() * 3)) * 3600000 }))
    if (injuredEntries.length) {
      addInjuries(injuredEntries)
      const now = Date.now()
      addNotifications(injuredEntries.map(e => {
        const fc = fieldCards.find(c => c.instanceId === e.instanceId)
        const ms = e.until - now
        const h = Math.floor(ms / 3600000)
        const m = Math.floor((ms % 3600000) / 60000)
        const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`
        return {
          id: `injury_${e.instanceId}_${e.until}`,
          type: 'injury',
          message: `🩹 ${fc?.name || 'Zawodnik'} jest kontuzjowany — niedostępny przez ${timeStr}`,
          timestamp: now,
          read: false,
        }
      }))
    }
    const isFirstWin = result === 'win' && profile.wins === 0 && !profile.hasClaimedFirstWinReward
    if (isFirstWin) {
      claimFirstWinReward()
      setFirstWinReward(true)
    } else {
      setTimeout(() => replace('post_match', {
        result, score, matchType, coinsEarned: coins, ratingChange,
        goalEvents: matchState.goalEvents, playerOfMatch, log: matchState.log,
        opponentName,
      }), 800)
    }
  }, [matchState.phase])

  // ── Goal detection ────────────────────────────────────────────────────────
  const prevScoreRef = useRef(matchState.displayScore)
  useEffect(() => {
    const prev = prevScoreRef.current
    const curr = matchState.displayScore
    if (curr.player > prev.player) {
      const ev = [...matchState.goalEvents].reverse().find(e => e.scorer === 'player')
      setGoalAnim({ scorer: 'player', score: curr, cardName: ev?.cardName || null })
      SFX.goalPlayer()
    } else if (curr.ai > prev.ai) {
      const ev = [...matchState.goalEvents].reverse().find(e => e.scorer === 'ai')
      setGoalAnim({ scorer: 'ai', score: curr, cardName: ev?.cardName || null })
      SFX.goalAI()
    }
    prevScoreRef.current = curr
  }, [matchState.displayScore.player, matchState.displayScore.ai])

  // Interactive tutorial: step 0→1 when first card placed, step 1→2 after first end turn
  const totalFieldCards = matchState.players.A.offenseSector.length + matchState.players.A.defenseSector.length
  useEffect(() => {
    if (tutStep === 0 && totalFieldCards > 0) setTutStep(1)
  }, [totalFieldCards])

  useEffect(() => {
    if (tutStep === 1 && matchState.round > 1) {
      setTutStep(2)
      setTimeout(() => { setTutStep(null); markTutorialSeen() }, 2800)
    }
  }, [matchState.round])

  // Keep handleEndTurnRef current so the timer closure always calls the latest version
  useEffect(() => { handleEndTurnRef.current = handleEndTurn }, [handleEndTurn])

  // ── Turn timer (45 s) ─────────────────────────────────────────────────────
  useEffect(() => {
    const active = matchState.currentPlayer === 'A' && matchState.phase === 'playing'
    if (!active) {
      setTurnSecsLeft(45)
      return
    }
    setTurnSecsLeft(45)
    const id = setInterval(() => {
      setTurnSecsLeft(s => {
        if (s <= 1) {
          clearInterval(id)
          handleEndTurnRef.current?.()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [matchState.currentPlayer, matchState.phase, matchState.round])

  // Watch log for new ability/event messages to show as toasts
  const prevLogLenRef = useRef(0)
  useEffect(() => {
    const current = matchState.log
    if (current.length > prevLogLenRef.current) {
      const newest = current[0]
      if (newest && newest.round === matchState.round) {
        if (newest.type === 'warning' || newest.type === 'special') showNotif(newest.message)
        if (newest.type === 'destroy') { SFX.cardDestroy(); showNotif(newest.message) }
      }
    }
    prevLogLenRef.current = current.length
  }, [matchState.log.length])

  // ── Placement helper ──────────────────────────────────────────────────────
  const placeCard = useCallback((sector) => {
    const card = dragRef.current?.card || selectedCard
    if (!card) return
    if (!canPlaceInSector(card, sector)) { showNotif(`${card.name} nie pasuje!`); SFX.error(); return }
    const actionKey = sector === 'offense' ? 'placedOffense' : 'placedDefense'
    if (matchState.turnActionsUsed[actionKey]) { showNotif('Już wystawiłeś kartę w tym sektorze.'); SFX.error(); return }
    const sectorCards = matchState.players.A[sector === 'offense' ? 'offenseSector' : 'defenseSector']
    if (sectorCards.length >= MAX_SECTOR_SIZE) { showNotif('Sektor pełny!'); SFX.error(); return }
    SFX.cardPlace()
    dispatch({ type: 'PLACE_CARD', playerId: 'A', cardInstanceId: card.instanceId, sector })
    setSelectedCard(null)
  }, [matchState, selectedCard])

  const handleFirstWinDismiss = useCallback(() => {
    setFirstWinReward(false)
    const score = matchState.displayScore
    const result = score.player > score.ai ? 'win' : score.ai > score.player ? 'loss' : 'draw'
    const coins = computeRewardCoins(result, matchType, Math.abs(score.player - score.ai))
    const ratingChange = computeRatingChange(result, matchType)
    const playerOfMatch = determinePlayerOfMatch(matchState.goalEvents,
      { offense: matchState.players.A.offenseSector, defense: matchState.players.A.defenseSector }, {})
    replace('post_match', {
      result, score, matchType, coinsEarned: coins, ratingChange,
      goalEvents: matchState.goalEvents, playerOfMatch, log: matchState.log,
      opponentName,
    })
  }, [matchState])

  // ── Field card: single tap → zoom, double tap → pull to hand ──────────────
  const handleFieldTap = (card, sector) => {
    if (matchState.phase !== 'playing') return
    const now = Date.now()
    const last = lastTapRef.current[card.instanceId] || 0
    lastTapRef.current[card.instanceId] = now

    if (isPlayerTurn && now - last < 360) {
      // Double tap → pull back to hand
      SFX.substitution()
      dispatch({ type: 'SUBSTITUTE_CARD', playerId: 'A', cardInstanceId: card.instanceId, sector })
      setZoomCard(null)
    } else {
      // Single tap → zoom with actions
      SFX.cardSelect()
      setZoomCard({ card, isPlayerField: isPlayerTurn, sector })
    }
  }

  const showNotif = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2400)
  }

  // ── Touch drag from hand ──────────────────────────────────────────────────
  const handleDragStart = (e, card) => {
    if (!isPlayerTurn) return
    const touch = e.touches?.[0]
    if (!touch) return
    dragRef.current = { card, moved: false, startX: touch.clientX, startY: touch.clientY }
  }

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current) return
    const touch = e.touches?.[0]
    if (!touch) return
    const dx = Math.abs(touch.clientX - dragRef.current.startX)
    const dy = Math.abs(touch.clientY - dragRef.current.startY)
    if (dx > 6 || dy > 6) {
      dragRef.current.moved = true
      setDragPos({ x: touch.clientX, y: touch.clientY })
      setSelectedCard(dragRef.current.card)
      const els = document.elementsFromPoint(touch.clientX, touch.clientY)
      const zoneEl = els.find(el => el.dataset?.zone)
      setDragZone(zoneEl?.dataset.zone || null)
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current) return
    if (dragRef.current.moved && dragZone) placeCard(dragZone)
    dragRef.current = null
    setDragPos(null)
    setDragZone(null)
  }, [dragZone, placeCard])

  useEffect(() => {
    window.addEventListener('touchmove', handleDragMove, { passive: true })
    window.addEventListener('touchend', handleDragEnd)
    return () => {
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  // ── Computed values ───────────────────────────────────────────────────────
  const { phase, round, currentPlayer, players, displayScore, turnActionsUsed, coinFlipState, specialCard } = matchState
  const playerA = players.A
  const playerB = players.B
  const isPlayerTurn = currentPlayer === 'A' && phase === 'playing'
  const canActivate = isPlayerTurn && !turnActionsUsed.activatedAbility && !coinFlipState

  const aiTotalAtk = playerB.offenseSector.reduce((s, c) => s + (c.currentAttackStat ?? c.attackStat ?? 0), 0)
  const aiTotalDef = (playerB.activeGoalkeeper
    ? (playerB.activeGoalkeeper.currentDefenseStat ?? playerB.activeGoalkeeper.defenseStat ?? 0) : 0)
    + playerB.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? c.defenseStat ?? 0), 0)
  const myTotalAtk = playerA.offenseSector.reduce((s, c) => s + (c.currentAttackStat ?? c.attackStat ?? 0), 0)
  const myTotalDef = (playerA.activeGoalkeeper
    ? (playerA.activeGoalkeeper.currentDefenseStat ?? playerA.activeGoalkeeper.defenseStat ?? 0) : 0)
    + playerA.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? c.defenseStat ?? 0), 0)

  // Half / period label
  const halfLabel = round <= 5 ? '1. POŁOWA' : round <= 10 ? '2. POŁOWA' : 'DOGRYWKA'
  const isExtraTime = round > 10

  // Upcoming event hints (shown during player A's turn)
  const drawRounds = [3, 5, 7, 9]
  const upcomingDraw = isPlayerTurn && drawRounds.includes(round + 1) && [2, 4, 6, 8].includes(round)
  const upcomingSpecial = isPlayerTurn && round === 5 && !matchState.specialCardRevealed

  // Goal scorer counts (player only — shown on field cards)
  const goalScorerCounts = matchState.goalEvents
    .filter(ev => ev.scorer === 'player' && ev.cardId)
    .reduce((acc, ev) => { acc[ev.cardId] = (acc[ev.cardId] || 0) + 1; return acc }, {})

  // Active coin flip card (check both player and AI sectors)
  const coinFlipCard = coinFlipState
    ? [
        ...playerA.offenseSector, ...playerA.defenseSector,
        ...matchState.players.B.offenseSector, ...matchState.players.B.defenseSector,
      ].find(c => c.instanceId === coinFlipState.cardInstanceId)
    : null

  // ── Pre-match screen ──────────────────────────────────────────────────────
  if (phase === 'goalkeeper_selection') {
    const allSquadCards = [...playerA.goalkeepers, ...playerA.deck]
    const cardByInstance = Object.fromEntries(allSquadCards.map(c => [c.instanceId, c]))

    // Use saved assignments if available; otherwise auto-assign by card type from activeDeck
    const assignments = (() => {
      if (profile.deckAssignments) {
        const ownedSet = new Set(allSquadCards.map(c => c.instanceId))
        const result = {}
        for (const [slot, id] of Object.entries(profile.deckAssignments)) {
          result[slot] = id && ownedSet.has(id) ? id : null
        }
        return result
      }
      const SLOT_ORDER = [
        { id: 'atk1', type: 'attack'     }, { id: 'atk2', type: 'attack'     },
        { id: 'mid1', type: 'midfield'   }, { id: 'mid2', type: 'midfield'   },
        { id: 'mid3', type: 'midfield'   }, { id: 'mid4', type: 'midfield'   },
        { id: 'def1', type: 'defense'    }, { id: 'def2', type: 'defense'    },
        { id: 'def3', type: 'defense'    }, { id: 'def4', type: 'defense'    },
        { id: 'gk1',  type: 'goalkeeper' },
        { id: 'res1', type: null }, { id: 'res2', type: null }, { id: 'res3', type: null },
      ]
      const deckSet = new Set(profile.activeDeck || [])
      const queues = { attack: [], midfield: [], defense: [], goalkeeper: [] }
      for (const c of allSquadCards) {
        if (deckSet.has(c.instanceId) && queues[c.type]) queues[c.type].push(c.instanceId)
      }
      const result = {}
      const assigned = new Set()
      for (const { id, type } of SLOT_ORDER) {
        if (!type) { result[id] = null; continue }
        const q = queues[type]
        if (q?.length) { result[id] = q.shift(); assigned.add(result[id]) }
        else result[id] = null
      }
      const rem = allSquadCards.filter(c => deckSet.has(c.instanceId) && !assigned.has(c.instanceId))
      ;['res1','res2','res3'].forEach((s, i) => { result[s] = rem[i]?.instanceId ?? null })
      return result
    })()

    const primaryGkId = assignments.gk1
    const primaryGk = playerA.goalkeepers.find(g => g.instanceId === primaryGkId) || playerA.goalkeepers[0]
    const MATCH_TYPE_LABEL = { league: '🏆 MECZ LIGOWY', training_amateur: '🟢 TRENING AMATOR', training_pro: '🔴 TRENING PRO' }
    const TYPE_C = { attack: '#ef5350', midfield: '#ab47bc', defense: '#42a5f5', goalkeeper: '#ffa000' }
    const TYPE_L = { attack: 'A', midfield: 'M', defense: 'D', goalkeeper: 'G' }

    const getCard = (slotId) => {
      const id = assignments[slotId]
      return id ? cardByInstance[id] : null
    }

    const PlayerCard = ({ card, isGk, small }) => {
      const [imgFailed, setImgFailed] = React.useState(false)
      if (!card) return (
        <div className={`pm-card${small ? ' pm-card--small' : ''}`}>
          <div className="pm-card-inner pm-card-inner--empty" />
          <div className="pm-card-name pm-card-name--empty">&nbsp;</div>
        </div>
      )
      const stat = (isGk || card.type === 'goalkeeper')
        ? (card.currentDefenseStat ?? card.defenseStat ?? 0)
        : (card.currentAttackStat ?? card.attackStat ?? 0)
      const tc = TYPE_C[card.type] || '#888'
      const posL = TYPE_L[card.type] || '?'
      return (
        <div className={`pm-card${small ? ' pm-card--small' : ''}`}>
          <div className="pm-card-inner" style={{
            background: card.color
              ? `linear-gradient(170deg, ${card.color}bb 0%, #060d06 100%)`
              : 'linear-gradient(170deg,#152a18,#060d06)',
            borderColor: tc,
          }}>
            {!imgFailed
              ? <img src={`/avatars/${card.id}.png`} alt="" className="pm-card-img" onError={() => setImgFailed(true)} draggable={false} />
              : <span className="pm-card-init">{(card.name || '?')[0]}</span>
            }
            <span className="pm-card-pos" style={{ background: tc }}>{posL}</span>
            <span className="pm-card-stat">{stat}</span>
          </div>
          <div className="pm-card-name">{card.name.split(' ')[0].toUpperCase()}</div>
        </div>
      )
    }

    const FormRow = ({ slots, isGk, small }) => (
      <div className="pm-row">
        {slots.map(slotId => <PlayerCard key={slotId} card={getCard(slotId)} isGk={isGk} small={small} />)}
      </div>
    )

    const fieldSlots = ['atk1','atk2','mid1','mid2','mid3','mid4','def1','def2','def3','def4']
    const benchSlots = ['res1','res2','res3']
    const missingField = fieldSlots.filter(s => !getCard(s)).length
    const missingBench = benchSlots.filter(s => !getCard(s)).length
    const canPlay = primaryGk && missingField === 0 && missingBench === 0

    const handlePlay = () => {
      if (prematchLoading) return
      if (!canPlay) {
        const parts = []
        if (!primaryGk) parts.push('bramkarz')
        if (missingField > 0) parts.push(`${missingField} ${missingField === 1 ? 'zawodnik w polu' : 'zawodników w polu'}`)
        if (missingBench > 0) parts.push(`${missingBench} ${missingBench === 1 ? 'miejsce na ławce' : 'miejsc na ławce'}`)
        setIncompleteMsg(`Brakuje: ${parts.join(', ')}.`)
        return
      }
      setPrematchLoading(true)
      SFX.matchStart()
      setTimeout(() => {
        dispatch({ type: 'SELECT_GOALKEEPER', playerId: 'A', gkInstanceId: primaryGk.instanceId })
      }, 900)
    }

    const resCards = ['res1','res2','res3'].map(getCard).filter(Boolean)
    const atkCount = ['atk1','atk2'].filter(s => getCard(s)).length
    const midCount = ['mid1','mid2','mid3','mid4'].filter(s => getCard(s)).length
    const defCount = ['def1','def2','def3','def4'].filter(s => getCard(s)).length
    const formationStr = `${defCount}-${midCount}-${atkCount}`
    const maxCols = Math.max(defCount, midCount, atkCount, 2)

    return (
      <div className="ms-prematch">

        {/* ── Top bar ── */}
        <div className="ms-pm-topbar">
          <button className="ms-pm-back-btn" onClick={() => replace('main_menu', {})}>←</button>
          <div className="ms-pm-header">
            <div className="ms-pm-match-type">{MATCH_TYPE_LABEL[matchType] || 'MECZ'}</div>
            <div className="ms-pm-vs">
              <span className="ms-pm-you">{profile.name || 'TY'}</span>
              <span className="ms-pm-vs-sep">vs</span>
              <span className="ms-pm-opp">{opponentName}</span>
            </div>
          </div>
        </div>

        {/* ── Pitch ── */}
        <div className="ms-pm-pitch">
          {/* Markings */}
          <div className="pm-pitch-lines" aria-hidden="true">
            <div className="pm-pitch-box pm-pitch-box--top" />
            <div className="pm-pitch-box pm-pitch-box--inner-top" />
            <div className="pm-pitch-line--mid" />
            <div className="pm-pitch-circle" />
            <div className="pm-pitch-box pm-pitch-box--inner-bottom" />
            <div className="pm-pitch-box pm-pitch-box--bottom" />
          </div>

          {/* Formation badge */}
          <div className="pm-formation-badge">
            <span className="pm-formation-str">{formationStr}</span>
            <div className="pm-fdots">
              {[atkCount, midCount, defCount, 1].map((cnt, ri) => (
                <div key={ri} className="pm-fdot-row">
                  {Array.from({ length: maxCols }).map((_, ci) => (
                    <div key={ci} className={`pm-fdot${ci < cnt ? ' pm-fdot--on' : ''}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Formation */}
          <div className="pm-formation">
            <FormRow slots={['atk1','atk2']} />
            <FormRow slots={['mid1','mid2','mid3','mid4']} />
            <FormRow slots={['def1','def2','def3','def4']} />
            <FormRow slots={['gk1']} isGk />
          </div>

          {/* Reserves inside pitch */}
          {resCards.length > 0 && (
            <div className="ms-pm-reserves">
              <div className="ms-pm-res-divider">
                <div className="ms-pm-res-line" />
                <span className="ms-pm-res-label">REZERWA</span>
                <div className="ms-pm-res-line" />
              </div>
              <div className="pm-row pm-row--res">
                {resCards.map(card => <PlayerCard key={card.instanceId} card={card} small />)}
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom controls ── */}
        <div className="ms-pm-bottom">
          <button className="ms-pm-lineup" onClick={() => navigate('deck_builder')}>⇄ Zmień skład</button>
          <div className="ms-pm-actions">
            <button className="ms-pm-back" onClick={() => replace('main_menu', {})}>← POWRÓT</button>
            <button
              className={`ms-pm-play${!canPlay ? ' ms-pm-play--invalid' : ''}`}
              onClick={handlePlay}
              disabled={prematchLoading}
            >
              {prematchLoading
                ? <span className="ms-pm-loading-dots"><span /><span /><span /></span>
                : !canPlay ? '⚠ UZUPEŁNIJ SKŁAD' : '▶ GRAJ'}
            </button>
          </div>
        </div>

        {/* ── Incomplete squad popup ── */}
        {incompleteMsg && (
          <div className="ms-incomplete-backdrop" onClick={() => { setIncompleteMsg(null); navigate('deck_builder') }}>
            <div className="ms-incomplete-modal" onClick={e => e.stopPropagation()}>
              <div className="ms-incomplete-icon">⚠️</div>
              <div className="ms-incomplete-title">Uzupełnij skład</div>
              <div className="ms-incomplete-body">{incompleteMsg}</div>
              <button className="ms-incomplete-btn" onClick={() => { setIncompleteMsg(null); navigate('deck_builder') }}>
                Przejdź do składu
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="match-screen">

      {/* ── Scoreboard ──────────────────────────────────────────────────── */}
      <div className="ms-scoreboard">
        <div className="msb-side msb-side--left">
          <div className="msb-team-icon msb-team-icon--ai">⚡</div>
          <span className={`msb-dot ${currentPlayer === 'B' ? 'msb-dot--on' : ''}`} />
          <span className="msb-name">{opponentName}</span>
        </div>
        <div className="msb-score-wrap">
          <div className="msb-score">
            <span className={`msb-num ${displayScore.ai > displayScore.player ? 'msb-num--win' : ''}`}>{displayScore.ai}</span>
            <span className="msb-sep">:</span>
            <span className={`msb-num ${displayScore.player > displayScore.ai ? 'msb-num--win' : ''}`}>{displayScore.player}</span>
          </div>
          <div className="msb-segments-row">
            <div className="msb-seg-group">
              {[1,2,3,4,5].map(r => (
                <span key={r} className={`msb-seg${round >= r ? ' msb-seg--on' : ''}${round === r && !isExtraTime && r <= 5 ? ' msb-seg--cur' : ''}`} />
              ))}
            </div>
            <span className={`msb-seg-round${matchState.maxRounds !== 10 ? ' msb-seg-round--custom' : ''}${isExtraTime ? ' msb-seg-round--extra' : ''}`}>
              R{round}
            </span>
            <div className="msb-seg-group">
              {[6,7,8,9,10].map(r => (
                <span key={r} className={`msb-seg${round >= r ? ' msb-seg--on' : ''}${round === r && !isExtraTime ? ' msb-seg--cur' : ''}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="msb-side msb-side--right">
          <span className="msb-name">TY</span>
          <span className={`msb-dot ${currentPlayer === 'A' ? 'msb-dot--on' : ''}`} />
          <div className="msb-team-icon msb-team-icon--player">🛡</div>
        </div>
      </div>

      {/* ── Field ───────────────────────────────────────────────────────── */}
      <div className="ms-field-wrap">
        <div className="ms-field-markings" aria-hidden="true" />
        {!isPlayerTurn && phase === 'playing' && (
          <div className="ms-turn-banner">
            {aiThinking ? '🤔 Przeciwnik myśli...' : '⏳ Tura przeciwnika'}
          </div>
        )}

        {/* === AI GOAL (top) === */}
        <div className={`ms-goal ms-goal--ai${goalsCollapsed ? ' ms-goal--collapsed' : ''}`}>
          <GoalPosts side="ai" />
          <div className="ms-goal-inner">
            <div className="ms-stat-box ms-stat-box--atk">
              <span className="msb-lbl">ATK</span>
              <span className="msb-num">{aiTotalAtk}</span>
              <span className="msb-icon">⚔️</span>
            </div>
            <div className="ms-gk-wrap">
              <span className="ms-gk-glove ms-gk-glove--left">🧤</span>
              <GKCard
                card={playerB.activeGoalkeeper}
                side="ai"
                onTap={() => playerB.activeGoalkeeper && setZoomCard({ card: playerB.activeGoalkeeper, isPlayerField: false })}
              />
              <span className="ms-gk-glove ms-gk-glove--right">🧤</span>
            </div>
            <div className="ms-stat-box ms-stat-box--def">
              <span className="msb-lbl">DEF</span>
              <span className="msb-num">{aiTotalDef}</span>
              <span className="msb-icon">🛡️</span>
            </div>
          </div>
          {aiThinking && !goalsCollapsed && <div className="ms-thinking">🤔 myśli...</div>}
          <div className="ms-goal-tab" onClick={() => setGoalsCollapsed(g => !g)}>
            <span className="ms-goal-tab-arrow">{goalsCollapsed ? '▼' : '▲'}</span>
            <span className="ms-goal-tab-label">{goalsCollapsed ? `BOT ${aiTotalAtk}⚔ ${aiTotalDef}🛡` : 'ZWIŃ'}</span>
          </div>
        </div>

        {/* === AI FIELD === */}
        <div className="ms-half ms-half--ai">
          <Zone
            label="⚔ ATAK"
            cards={playerB.offenseSector}
            side="ai"
            onCardTap={(c) => setZoomCard({ card: c, isPlayerField: false })}
            fieldSize={true}
          />
          <div className="ms-zone-sep" />
          <Zone
            label="🛡 OBRONA"
            cards={playerB.defenseSector}
            side="ai"
            onCardTap={(c) => setZoomCard({ card: c, isPlayerField: false })}
            fieldSize={true}
          />
        </div>

        {/* === MIDFIELD LINE === */}
        <div className="ms-midfield">
          <button className="ms-log-btn" onClick={() => setShowLog(true)} title="Dziennik meczu">ℹ</button>
          <div className="ms-mid-line" />
          {upcomingSpecial
            ? <div className="ms-mid-event ms-mid-event--special">🃏 Karta specjalna po rundzie!</div>
            : upcomingDraw
            ? <div className="ms-mid-event ms-mid-event--draw">📤 Dobierasz kartę po rundzie</div>
            : <div className="ms-mid-ball">⚽</div>
          }
          <div className="ms-mid-line" />
        </div>

        {/* === PLAYER FIELD === */}
        <div className="ms-half ms-half--player">
          <Zone
            label="🛡 OBRONA"
            cards={playerA.defenseSector}
            side="player"
            zone="defense"
            onCardTap={(c) => handleFieldTap(c, 'defense')}
            goalCounts={goalScorerCounts}
            isDropTarget={selectedCard && canPlaceInSector(selectedCard, 'defense') && !turnActionsUsed.placedDefense && playerA.defenseSector.length < MAX_SECTOR_SIZE}
            onDrop={() => placeCard('defense')}
            dragZoneActive={dragZone === 'defense'}
            fieldSize={true}
            canActivate={canActivate}
          />
          <div className="ms-zone-sep" />
          <Zone
            label="⚔ ATAK"
            cards={playerA.offenseSector}
            side="player"
            zone="offense"
            onCardTap={(c) => handleFieldTap(c, 'offense')}
            goalCounts={goalScorerCounts}
            isDropTarget={selectedCard && canPlaceInSector(selectedCard, 'offense') && !turnActionsUsed.placedOffense && playerA.offenseSector.length < MAX_SECTOR_SIZE}
            onDrop={() => placeCard('offense')}
            dragZoneActive={dragZone === 'offense'}
            fieldSize={true}
            canActivate={canActivate}
          />
        </div>

        {/* === PLAYER GOAL (bottom) — column-reverse: first=bottom, last=top === */}
        <div className={`ms-goal ms-goal--player${goalsCollapsed ? ' ms-goal--collapsed' : ''}`}>
          <div className="ms-goal-tab" onClick={() => setGoalsCollapsed(g => !g)}>
            <span className="ms-goal-tab-arrow">{goalsCollapsed ? '▲' : '▼'}</span>
            <span className="ms-goal-tab-label">{goalsCollapsed ? `TY ${myTotalDef}🛡 ${myTotalAtk}⚔` : 'ZWIŃ'}</span>
          </div>
          <div className="ms-goal-inner">
            <div className="ms-stat-box ms-stat-box--def">
              <span className="msb-lbl">DEF</span>
              <span className="msb-num">{myTotalDef}</span>
              <span className="msb-icon">🛡️</span>
            </div>
            <div className="ms-gk-wrap">
              <span className="ms-gk-glove ms-gk-glove--left">🧤</span>
              <GKCard
                card={playerA.activeGoalkeeper}
                side="player"
                onTap={() => playerA.activeGoalkeeper && setZoomCard({ card: playerA.activeGoalkeeper, isPlayerField: false })}
              />
              <span className="ms-gk-glove ms-gk-glove--right">🧤</span>
            </div>
            <div className="ms-stat-box ms-stat-box--atk">
              <span className="msb-lbl">ATK</span>
              <span className="msb-num">{myTotalAtk}</span>
              <span className="msb-icon">⚔️</span>
            </div>
          </div>
          <GoalPosts side="player" />
        </div>

      </div>{/* end ms-field-wrap */}

      {/* ── Match log panel ──────────────────────────────────────────────── */}
      {showLog && (
        <MatchLogPanel
          log={matchState.log}
          round={round}
          onClose={() => setShowLog(false)}
        />
      )}

      {/* ── Hand ────────────────────────────────────────────────────────── */}
      <div className={`ms-hand-area${handCollapsed ? ' ms-hand-area--collapsed' : ''}${!isPlayerTurn && phase === 'playing' ? ' ms-hand-area--waiting' : ''}`}>
        <div className="ms-hand-toggle" onClick={() => setHandCollapsed(h => !h)}>
          <span className="ms-hand-toggle-arrow">{handCollapsed ? '▲' : '▼'}</span>
          <span className="ms-hand-toggle-label">RĘKA • {playerA.hand.length}</span>
          <div className="ms-hand-chips" onClick={e => e.stopPropagation()}>
            {turnActionsUsed.placedOffense  ? <span className="mac done">✓ ATK</span> : isPlayerTurn ? <span className="mac todo">ATK</span> : null}
            {turnActionsUsed.placedDefense  ? <span className="mac done">✓ DEF</span> : isPlayerTurn ? <span className="mac todo">DEF</span> : null}
            {turnActionsUsed.activatedAbility && <span className="mac done">✓ Skill</span>}
          </div>
          <span
            ref={deckBadgeRef}
            className="ms-deck-badge-sm ms-deck-badge-sm--tap"
            onClick={e => { e.stopPropagation(); setShowDeckPopup(p => !p) }}
          >🃏 {playerA.deck.length}</span>
        </div>
        <div className="ms-hand-scroll">
          {playerA.hand.map(card => (
            <FieldCard
              key={card.instanceId}
              card={card}
              selected={selectedCard?.instanceId === card.instanceId}
              onTap={() => {
                const now = Date.now()
                const last = lastTapRef.current[`h_${card.instanceId}`] || 0
                lastTapRef.current[`h_${card.instanceId}`] = now
                if (isPlayerTurn && now - last < 360) {
                  // Double tap → auto-place
                  const canOff = canPlaceInSector(card, 'offense') && !turnActionsUsed.placedOffense && playerA.offenseSector.length < MAX_SECTOR_SIZE
                  const canDef = canPlaceInSector(card, 'defense') && !turnActionsUsed.placedDefense && playerA.defenseSector.length < MAX_SECTOR_SIZE
                  if (canOff) { SFX.cardPlace(); dispatch({ type: 'PLACE_CARD', playerId: 'A', cardInstanceId: card.instanceId, sector: 'offense' }) }
                  else if (canDef) { SFX.cardPlace(); dispatch({ type: 'PLACE_CARD', playerId: 'A', cardInstanceId: card.instanceId, sector: 'defense' }) }
                  else showNotif('Brak wolnego miejsca!')
                  setSelectedCard(null)
                } else {
                  // Single tap → zoom stats
                  SFX.cardSelect()
                  setZoomCard({ card, isPlayerField: false, fromHand: true })
                }
              }}
              onLongPress={() => setZoomCard({ card, isPlayerField: false, fromHand: true })}
              onDragStart={handleDragStart}
            />
          ))}
          {playerA.hand.length === 0 && <div className="ms-hand-empty">Brak kart</div>}
          <div className="ms-deck-badge">🃏 {playerA.deck.length}</div>
        </div>
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div className="ms-action-bar">
        {isPlayerTurn && (
          <div className="ms-timer-bar">
            <div
              className={`ms-timer-fill${turnSecsLeft <= 10 ? ' ms-timer-fill--urgent' : ''}`}
              style={{ width: `${(turnSecsLeft / 45) * 100}%` }}
            />
            <span className={`ms-timer-text${turnSecsLeft <= 10 ? ' ms-timer-text--urgent' : ''}`}>{turnSecsLeft}s</span>
          </div>
        )}
        <div className="ms-action-row">
          <div className="ms-action-chips">
            {matchState.redraws < 2 && (
              <button className="ms-redraw-btn" onClick={() => setShowRedrawConfirm(true)} title="Przetasuj rękę">
                🔄 Dobierz 4 ({2 - matchState.redraws}/2)
              </button>
            )}
            {isPlayerTurn && (
              <button className="ms-forfeit-btn" onClick={() => setShowForfeit(true)}>🏳</button>
            )}
          </div>
          <button
            className={`ms-end-btn ${!isPlayerTurn ? 'ms-end-btn--wait' : ''}`}
            onClick={handleEndTurn}
            disabled={!isPlayerTurn || !!coinFlipState?.pending}
          >
            {!isPlayerTurn ? (aiThinking ? '🤔 Przeciwnik myśli...' : '⏳ Tura przeciwnika') : '→ Zakończ turę'}
          </button>
        </div>
      </div>

      {/* ── Redraw confirm ──────────────────────────────────────────────── */}
      {showRedrawConfirm && (
        <div className="ms-forfeit-confirm">
          <div className="ms-forfeit-panel">
            <div className="ms-forfeit-title">🔄 Przetasować rękę?</div>
            <div className="ms-forfeit-sub">Dobierzesz 4 nowe karty, ale Twoja obrona straci -5 DEF do końca meczu. Zostało przetasowań: {2 - matchState.redraws}/2</div>
            <div className="ms-forfeit-btns">
              <button className="ms-forfeit-yes" onClick={() => { dispatch({ type: 'REDRAW_HAND' }); setShowRedrawConfirm(false) }}>
                Tak, przetasuj
              </button>
              <button className="ms-forfeit-no" onClick={() => setShowRedrawConfirm(false)}>
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Forfeit confirm ──────────────────────────────────────────────── */}
      {showForfeit && (
        <div className="ms-forfeit-confirm">
          <div className="ms-forfeit-panel">
            <div className="ms-forfeit-title">🏳 Poddać mecz?</div>
            <div className="ms-forfeit-sub">Wynik zostanie zapisany jako 0:3</div>
            <div className="ms-forfeit-btns">
              <button className="ms-forfeit-yes" onClick={() => { dispatch({ type: 'FORFEIT' }); setShowForfeit(false) }}>
                Tak, poddaj
              </button>
              <button className="ms-forfeit-no" onClick={() => setShowForfeit(false)}>
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drag ghost ──────────────────────────────────────────────────── */}
      {dragPos && selectedCard && (
        <div className="ms-drag-ghost" style={{ left: dragPos.x - 40, top: dragPos.y - 55 }}>
          <FieldCard card={selectedCard} />
        </div>
      )}

      {/* ── Notifications ───────────────────────────────────────────────── */}
      {notification && <div className="ms-notif">{notification}</div>}

      {/* ── Overlays ────────────────────────────────────────────────────── */}
      {!goalAnim && coinFlipState?.player === 'A' && (
        <CoinFlip
          coinFlipState={coinFlipState}
          card={coinFlipCard}
          onFlip={() => { SFX.coinFlip(); dispatch({ type: 'FLIP_COIN' }) }}
          onDismiss={() => dispatch({ type: 'DISMISS_COIN' })}
        />
      )}
      {!goalAnim && phase === 'special_card' && specialCard && (
        <SpecialCardModal card={specialCard} onDismiss={() => dispatch({ type: 'DISMISS_SPECIAL_CARD' })} />
      )}
      {goalAnim && settings.visualEffects !== false && (
        <GoalAnimation scorer={goalAnim.scorer} score={goalAnim.score} cardName={goalAnim.cardName} onDone={() => setGoalAnim(null)} />
      )}
      {zoomCard && (() => {
        const zc = zoomCard.card
        const placements = []
        if (zoomCard.fromHand && isPlayerTurn) {
          if (canPlaceInSector(zc, 'offense') && !turnActionsUsed.placedOffense && playerA.offenseSector.length < MAX_SECTOR_SIZE)
            placements.push({ label: '⚔ Wystaw w Ataku', onClick: () => { SFX.cardPlace(); dispatch({ type: 'PLACE_CARD', playerId: 'A', cardInstanceId: zc.instanceId, sector: 'offense' }); setZoomCard(null) } })
          if (canPlaceInSector(zc, 'defense') && !turnActionsUsed.placedDefense && playerA.defenseSector.length < MAX_SECTOR_SIZE)
            placements.push({ label: '🛡 Wystaw w Obronie', onClick: () => { SFX.cardPlace(); dispatch({ type: 'PLACE_CARD', playerId: 'A', cardInstanceId: zc.instanceId, sector: 'defense' }); setZoomCard(null) } })
        }
        return (
          <CardZoomModal
            card={zc}
            isPlayerField={zoomCard.isPlayerField}
            canActivate={canActivate}
            placements={placements}
            onActivate={() => {
              if (matchState.turnActionsUsed.activatedAbility) { showNotif('Już aktywowano umiejętność tej tury.'); return }
              SFX.activateAbility()
              dispatch({ type: 'ACTIVATE_ABILITY', playerId: 'A', cardInstanceId: zc.instanceId })
              setZoomCard(null)
            }}
            onSubstitute={zoomCard.isPlayerField && zoomCard.sector ? () => {
              SFX.substitution()
              dispatch({ type: 'SUBSTITUTE_CARD', playerId: 'A', cardInstanceId: zc.instanceId, sector: zoomCard.sector })
              setZoomCard(null)
            } : null}
            onClose={() => setZoomCard(null)}
          />
        )
      })()}

      {/* ── Deck popup ──────────────────────────────────────────────────── */}
      {showDeckPopup && (
        <div className="ms-deck-popup-backdrop" onClick={() => setShowDeckPopup(false)}>
          <div className="ms-deck-popup" onClick={e => e.stopPropagation()}>
            <div className="ms-deck-popup-title">Pozostało w talii: {playerA.deck.length} kart</div>
            <div className="ms-deck-popup-list">
              {playerA.deck.length === 0
                ? <div className="ms-deck-popup-empty">Talia pusta</div>
                : playerA.deck.map((card, i) => (
                  <div key={card.instanceId || i} className="ms-deck-popup-item">{card.name}</div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Tutorial ────────────────────────────────────────────────────── */}
      {tutStep !== null && (
        <InteractiveTutorial step={tutStep} onSkip={() => { setTutStep(null); markTutorialSeen() }} />
      )}

      {firstWinReward && (
        <FirstWinRewardOverlay onDone={handleFirstWinDismiss} />
      )}
    </div>
  )
}

// ── Interactive tutorial bar ───────────────────────────────────────────────

const TUT_STEPS = [
  {
    title: 'Twoje karty są tutaj!',
    text: 'Dotknij kartę dwa razy szybko → zawodnik trafi na boisko.',
  },
  {
    title: 'Wystawiłeś zawodnika!',
    text: 'Teraz kliknij "Zakończ turę" → gole liczą się po każdej pełnej rundzie.',
  },
  {
    title: '✓ Wiesz jak grać!',
    text: 'Aktywuj umiejętności kart, zbieraj gole, wygrywaj mecze. Powodzenia!',
  },
]

function InteractiveTutorial({ step, onSkip }) {
  const s = TUT_STEPS[Math.min(step, TUT_STEPS.length - 1)]
  const isDone = step >= 2
  return (
    <div className={`tut-bar${isDone ? ' tut-bar--done' : ''}`}>
      <div className="tut-bar-content">
        <div className="tut-bar-title">{s.title}</div>
        <div className="tut-bar-text">{s.text}</div>
      </div>
      {!isDone
        ? <button className="tut-bar-skip" onClick={onSkip}>Pomiń</button>
        : <div className="tut-bar-check">✓</div>
      }
    </div>
  )
}

// ── First win reward overlay ───────────────────────────────────────────────

function FirstWinRewardOverlay({ onDone }) {
  return (
    <div className="fwr-overlay">
      <div className="fwr-box">
        <div className="fwr-fireworks">🎉</div>
        <div className="fwr-title">Pierwsza Wygrana!</div>
        <div className="fwr-subtitle">Świetna robota — nauczyłeś się podstaw!</div>
        <div className="fwr-reward">
          <div className="fwr-reward-icon">🪙</div>
          <div className="fwr-reward-text">
            <div className="fwr-reward-amount">+200 monet</div>
            <div className="fwr-reward-label">Nagroda za debiut</div>
          </div>
        </div>
        <button className="fwr-btn" onClick={onDone}>Odbierz nagrodę!</button>
      </div>
    </div>
  )
}

// ── Zone sub-component ─────────────────────────────────────────────────────

function Zone({ label, cards, side, zone, onCardTap, goalCounts, isDropTarget, onDrop, dragZoneActive, fieldSize, canActivate }) {
  return (
    <div
      className={[
        'ms-zone',
        `ms-zone--${side}`,
        isDropTarget ? 'ms-zone--droptarget' : '',
        dragZoneActive ? 'ms-zone--dragover' : '',
      ].filter(Boolean).join(' ')}
      data-zone={zone}
      onClick={isDropTarget && !dragZoneActive ? onDrop : undefined}
    >
      <span className="msz-label">{label}</span>
      <div className={`msz-cards${cards.length >= 3 ? ' msz-cards--full' : ''}`}>
        {cards.map(card => {
          const canActivateAbility = !!(canActivate && card.abilityType !== 'passive' && !card.isDestroyed && !card.isLocked && !card.justPlaced)
          return (
            <FieldCard
              key={card.instanceId}
              card={card}
              faceDown={side === 'ai' && card.faceDown}
              isNew={card.justPlaced}
              goalCount={goalCounts?.[card.instanceId] || 0}
              onTap={() => onCardTap?.(card)}
              fieldSize={fieldSize}
              canActivateAbility={canActivateAbility}
            />
          )
        })}
        {cards.length === 0 && !isDropTarget && (
          <div className="msz-empty">—</div>
        )}
        {isDropTarget && cards.length < MAX_SECTOR_SIZE && (
          <div className="msz-drop-slot" data-zone={zone} onClick={e => { e.stopPropagation(); onDrop?.() }}>
            ＋
          </div>
        )}
      </div>
    </div>
  )
}
