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
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'
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
          </div>
          <div className="zoom-stat">
            <span className="zs-label">DEF</span>
            <span className="zs-val zs-val--def">{defVal}</span>
          </div>
          {card.upgradeLevel > 0 && (
            <div className="zoom-stat">
              <span className="zs-label">LVL</span>
              <span className="zs-val" style={{ color: '#ffd54f' }}>+{card.upgradeLevel}</span>
            </div>
          )}
        </div>

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
  const { replace } = useRouter()
  const { profile, addMatchResult, markTutorialSeen } = useProfile()
  const { settings } = useSettings()

  const matchType = matchParams.matchType || 'local'
  const opponentName = matchParams.opponentName || 'BOT'

  const [matchState, dispatch] = useReducer(gameReducer, null, () => {
    const playerDeck = buildPlayerDeck(profile)
    const aiDeck =
      matchType === 'league'           ? createBalancedAIDeck(playerDeck) :
      matchType === 'training_amateur' ? createWeakerAIDeck(playerDeck) :
      matchType === 'training_pro'     ? createEliteAIDeck() :
                                         createDefaultDeck('B')
    return createMatchState(matchType, playerDeck, aiDeck)
  })

  const [showTutorial, setShowTutorial] = useState(!profile.hasSeenTutorial)
  const [aiThinking, setAiThinking] = useState(false)
  const [goalAnim, setGoalAnim] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)   // only for drag ghost
  const [zoomCard, setZoomCard] = useState(null)           // { card, isPlayerField, sector }
  const [notification, setNotification] = useState(null)
  const [showForfeit, setShowForfeit] = useState(false)
  const [showRedrawConfirm, setShowRedrawConfirm] = useState(false)
  const [goalsCollapsed, setGoalsCollapsed] = useState(false)
  const [handCollapsed, setHandCollapsed] = useState(false)

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
    addMatchResult({ type: result, matchType, score, coinsEarned: coins, ratingChange, playerGoals: score.player })
    setTimeout(() => replace('post_match', {
      result, score, matchType, coinsEarned: coins, ratingChange,
      goalEvents: matchState.goalEvents, playerOfMatch, log: matchState.log,
    }), 800)
  }, [matchState.phase])

  // ── Goal detection ────────────────────────────────────────────────────────
  const prevScoreRef = useRef(matchState.displayScore)
  useEffect(() => {
    const prev = prevScoreRef.current
    const curr = matchState.displayScore
    if (curr.player > prev.player) { setGoalAnim({ scorer: 'player', score: curr }); SFX.goalPlayer() }
    else if (curr.ai > prev.ai) { setGoalAnim({ scorer: 'ai', score: curr }); SFX.goalAI() }
    prevScoreRef.current = curr
  }, [matchState.displayScore.player, matchState.displayScore.ai])

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

  const handleEndTurn = useCallback(() => {
    if (matchState.currentPlayer !== 'A' || matchState.coinFlipState?.pending) return
    SFX.endTurn()
    dispatch({ type: 'END_TURN' })
    setSelectedCard(null)
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

  // ── GK Selection ──────────────────────────────────────────────────────────
  if (phase === 'goalkeeper_selection') {
    return (
      <div className="ms-gk-select">
        <div className="ms-gk-header">
          <h2>Wybierz Bramkarza</h2>
          <p>Drugi trafi do rezerwy</p>
        </div>
        <div className="ms-gk-cards">
          {playerA.goalkeepers.map(gk => (
            <div key={gk.instanceId} className="ms-gk-option">
              <FieldCard card={gk} onTap={() => {}} />
              <button
                className="ms-gk-pick-btn"
                onClick={() => dispatch({ type: 'SELECT_GOALKEEPER', playerId: 'A', gkInstanceId: gk.instanceId })}
              >
                Wybierz
              </button>
            </div>
          ))}
        </div>
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
          <div className="msb-round-row">
            <span className="msb-round-badge">R{round}</span>
            <span className="msb-round-of">/10</span>
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
          <div className="ms-mid-line" />
          <div className="ms-mid-ball">⚽</div>
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

      {/* ── Hand ────────────────────────────────────────────────────────── */}
      <div className={`ms-hand-area${handCollapsed ? ' ms-hand-area--collapsed' : ''}${!isPlayerTurn && phase === 'playing' ? ' ms-hand-area--waiting' : ''}`}>
        <div className="ms-hand-toggle" onClick={() => setHandCollapsed(h => !h)}>
          <span className="ms-hand-toggle-arrow">{handCollapsed ? '▲' : '▼'}</span>
          <span className="ms-hand-toggle-label">RĘKA • {playerA.hand.length}</span>
          <span className="ms-deck-badge-sm">🃏 {playerA.deck.length}</span>
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
        <div className="ms-action-chips">
          {turnActionsUsed.placedOffense  && <span className="mac done">✓ ATK</span>}
          {turnActionsUsed.placedDefense  && <span className="mac done">✓ DEF</span>}
          {turnActionsUsed.activatedAbility && <span className="mac done">✓ Skill</span>}
          {!turnActionsUsed.placedOffense && isPlayerTurn && <span className="mac todo">ATK</span>}
          {!turnActionsUsed.placedDefense && isPlayerTurn && <span className="mac todo">DEF</span>}
          {matchState.redraws < 2 && (
            <button className="ms-redraw-btn" onClick={() => setShowRedrawConfirm(true)} title="Przetasuj rękę">
              🔄 +4 ({2 - matchState.redraws} lewe)
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
          {!isPlayerTurn ? (aiThinking ? '🤔 Bot...' : '⏳ Tura bota') : '→ Zakończ turę'}
        </button>
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
      {coinFlipState && (
        <CoinFlip
          coinFlipState={coinFlipState}
          card={coinFlipCard}
          onFlip={() => { SFX.coinFlip(); dispatch({ type: 'FLIP_COIN' }) }}
          onDismiss={() => dispatch({ type: 'DISMISS_COIN' })}
        />
      )}
      {phase === 'special_card' && specialCard && (
        <SpecialCardModal card={specialCard} onDismiss={() => dispatch({ type: 'DISMISS_SPECIAL_CARD' })} />
      )}
      {goalAnim && settings.visualEffects !== false && (
        <GoalAnimation scorer={goalAnim.scorer} score={goalAnim.score} onDone={() => setGoalAnim(null)} />
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

      {/* ── Tutorial ────────────────────────────────────────────────────── */}
      {showTutorial && (
        <TutorialOverlay
          onDone={() => {
            setShowTutorial(false)
            markTutorialSeen()
          }}
        />
      )}
    </div>
  )
}

// ── Tutorial overlay ───────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    emoji: '⚽',
    title: 'Witaj w GOAL TCG!',
    text: 'Grasz kartami piłkarzy, by strzelać gole. Mecz trwa 10 rund — każda runda to Twoja tura i tura bota.',
  },
  {
    emoji: '🃏',
    title: 'Karty w ręce',
    text: 'Zaczynasz z 4 kartami. Nowe karty dostajesz co 2 rundy (przed rundami 3, 5, 7, 9). Zarządzaj nimi mądrze!',
  },
  {
    emoji: '⚔',
    title: 'Wystawianie kart',
    text: 'Dotknij kartę → zobaczysz statystyki i umiejętność. Dotknij dwa razy szybko → karta trafia automatycznie na boisko.',
  },
  {
    emoji: '🔄',
    title: 'Zmiana zawodnika',
    text: 'Dwa szybkie tapnięcia w wystawionego zawodnika → wraca na ławkę. Możesz wystawić innego w tej samej turze!',
  },
  {
    emoji: '⚡',
    title: 'Umiejętności',
    text: 'Tapnij wystawionego zawodnika i naciśnij "Aktywuj". Każda tura możesz aktywować 1 umiejętność — używaj ich strategicznie!',
  },
  {
    emoji: '→',
    title: 'Zakończ turę',
    text: 'Po wystawieniu kart naciśnij "Zakończ turę". Gole obliczane są po każdej pełnej rundzie. Przycisk 🏳 to poddanie meczu.',
  },
]

function TutorialOverlay({ onDone }) {
  const [step, setStep] = useState(0)
  const s = TUTORIAL_STEPS[step]
  const isLast = step === TUTORIAL_STEPS.length - 1

  return (
    <div className="tut-backdrop">
      <div className="tut-panel">
        <div className="tut-emoji">{s.emoji}</div>
        <div className="tut-title">{s.title}</div>
        <div className="tut-text">{s.text}</div>
        <div className="tut-dots">
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} className={`tut-dot ${i === step ? 'tut-dot--active' : i < step ? 'tut-dot--done' : ''}`} />
          ))}
        </div>
        <button className="tut-next" onClick={() => isLast ? onDone() : setStep(s => s + 1)}>
          {isLast ? '⚽ Zaczynamy!' : 'Dalej →'}
        </button>
        <button className="tut-skip" onClick={onDone}>Pomiń samouczek</button>
      </div>
    </div>
  )
}

// ── Zone sub-component ─────────────────────────────────────────────────────

function Zone({ label, cards, side, zone, onCardTap, goalCounts, isDropTarget, onDrop, dragZoneActive, fieldSize }) {
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
      <div className="msz-cards">
        {cards.map(card => (
          <FieldCard
            key={card.instanceId}
            card={card}
            faceDown={side === 'ai' && card.faceDown}
            isNew={card.justPlaced}
            goalCount={goalCounts?.[card.instanceId] || 0}
            onTap={() => onCardTap?.(card)}
            fieldSize={fieldSize}
          />
        ))}
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
