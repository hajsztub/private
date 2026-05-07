import React, { useReducer, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile, useSettings } from '../App'
import {
  createMatchState, gameReducer, selectGoalkeeper,
  endTurn, canPlaceInSector, MAX_SECTOR_SIZE,
} from '../game/gameEngine'
import { runAITurn, pickAIGoalkeeper } from '../game/aiEngine'
import { computeRewardCoins, computeRatingChange, determinePlayerOfMatch } from '../game/scoreEngine'
import { createDeckFromOwned, CARD_DEFINITIONS, createDefaultDeck, createBalancedAIDeck } from '../data/cards'
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

function CardZoomModal({ card, onClose }) {
  if (!card) return null
  const isGK = card.type === 'goalkeeper'
  const atkVal = card.currentAttackStat ?? card.attackStat ?? 0
  const defVal = card.currentDefenseStat ?? card.defenseStat ?? 0
  const TYPE_LABEL = { attack: 'Napastnik', midfield: 'Pomocnik', defense: 'Obrońca', goalkeeper: 'Bramkarz' }
  const RARITY_LABEL = { common: 'Normalny', rare: 'Rzadki', legendary: 'Legendarny ★', starter: 'Starter' }
  const RARITY_C = { common: '#9e9e9e', rare: '#ff9800', legendary: '#ffd700', starter: '#607d8b' }

  return (
    <div className="zoom-backdrop" onClick={onClose}>
      <div className="zoom-panel" onClick={e => e.stopPropagation()}>
        {/* Big avatar */}
        <div className="zoom-avatar" style={{ background: `linear-gradient(160deg, ${card.color || '#eee'}, #fff)` }}>
          <img
            className="zoom-avatar-img"
            src={`/avatars/${card.id}.png`}
            alt=""
            onError={e => { e.target.style.display = 'none' }}
            draggable={false}
          />
          <div className="zoom-type-badge">{card.typeLabel} — {TYPE_LABEL[card.type] || card.type}</div>
          <div className="zoom-rarity" style={{ color: RARITY_C[card.rarity] }}>
            {RARITY_LABEL[card.rarity] || card.rarity}
          </div>
        </div>

        {/* Name */}
        <div className="zoom-name">{card.name}</div>

        {/* Stats */}
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

        {/* Ability */}
        <div className="zoom-ability">
          <div className="zoom-ability-name">{card.abilityName}</div>
          <div className="zoom-ability-type">
            {card.abilityType === 'passive' ? '🔵 PASYWNA'
              : card.abilityType === 'active_coin' ? '🟡 AKTYWNA (rzut żetonem)'
              : '🟢 AKTYWNA'}
          </div>
          <div className="zoom-ability-desc">{card.abilityDescription}</div>
          {card.noActivationDescription && card.abilityType !== 'passive' && (
            <div className="zoom-noact">
              <span className="zoom-noact-lbl">Brak aktywacji: </span>
              {card.noActivationDescription}
            </div>
          )}
        </div>

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
    const aiDeck = matchType === 'league'
      ? createBalancedAIDeck(playerDeck)
      : createDefaultDeck('B')
    return createMatchState(matchType, playerDeck, aiDeck)
  })

  const [showTutorial, setShowTutorial] = useState(!profile.hasSeenTutorial)

  const [aiThinking, setAiThinking] = useState(false)
  const [goalAnim, setGoalAnim] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)   // card in hand selected for placement
  const [fieldAction, setFieldAction] = useState(null)     // { card, sector } field card tapped
  const [zoomCard, setZoomCard] = useState(null)           // card zoom modal
  const [notification, setNotification] = useState(null)

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragRef = useRef(null)
  const [dragPos, setDragPos] = useState(null)    // { x, y }
  const [dragZone, setDragZone] = useState(null)  // 'offense' | 'defense' | null

  // ── GK setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'goalkeeper_selection') return
    if (!matchState.players.A.activeGoalkeeper || matchState.players.B.activeGoalkeeper) return
    const aiGK = pickAIGoalkeeper(matchState.players.B.goalkeepers)
    setTimeout(() => dispatch({ type: 'SELECT_GOALKEEPER', playerId: 'B', gkInstanceId: aiGK.instanceId }), 500)
  }, [matchState.phase, matchState.players.A.activeGoalkeeper, matchState.players.B.activeGoalkeeper])

  // SFX match start
  useEffect(() => {
    if (matchState.phase === 'playing' && matchState.round === 1) SFX.matchStart()
  }, [matchState.phase])

  // ── AI turn ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'playing' || matchState.currentPlayer !== 'B' || aiThinking) return
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
    addMatchResult({ type: result, matchType, score, coinsEarned: coins, ratingChange })
    setTimeout(() => replace('post_match', { result, score, matchType, coinsEarned: coins, ratingChange, goalEvents: matchState.goalEvents, playerOfMatch, log: matchState.log }), 800)
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

  // ── Placement helpers ─────────────────────────────────────────────────────
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
    setFieldAction(null)
  }, [matchState])

  const handleFieldTap = (card, sector) => {
    if (matchState.currentPlayer !== 'A' || matchState.phase !== 'playing') return
    if (fieldAction?.card.instanceId === card.instanceId) { setFieldAction(null); return }
    SFX.cardSelect()
    setSelectedCard(null)
    setFieldAction({ card, sector })
  }

  const handleSubstitute = () => {
    if (!fieldAction) return
    SFX.substitution()
    dispatch({ type: 'SUBSTITUTE_CARD', playerId: 'A', cardInstanceId: fieldAction.card.instanceId, sector: fieldAction.sector })
    setFieldAction(null)
  }

  const handleActivateField = () => {
    if (!fieldAction) return
    if (matchState.turnActionsUsed.activatedAbility) { showNotif('Już aktywowano umiejętność tej tury.'); return }
    SFX.activateAbility()
    dispatch({ type: 'ACTIVATE_ABILITY', playerId: 'A', cardInstanceId: fieldAction.card.instanceId })
    setFieldAction(null)
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
      // detect zone under finger
      const els = document.elementsFromPoint(touch.clientX, touch.clientY)
      const zoneEl = els.find(el => el.dataset?.zone)
      setDragZone(zoneEl?.dataset.zone || null)
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current) return
    if (dragRef.current.moved && dragZone) {
      placeCard(dragZone)
    }
    dragRef.current = null
    setDragPos(null)
    setDragZone(null)
  }, [dragZone, placeCard])

  // Attach global touch handlers when dragging
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

  const aiTotalAtk = playerB.offenseSector
    .reduce((s, c) => s + (c.currentAttackStat ?? c.attackStat ?? 0), 0)
  const aiTotalDef = (playerB.activeGoalkeeper
    ? (playerB.activeGoalkeeper.currentDefenseStat ?? playerB.activeGoalkeeper.defenseStat ?? 0) : 0)
    + playerB.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? c.defenseStat ?? 0), 0)
  const myTotalAtk = playerA.offenseSector
    .reduce((s, c) => s + (c.currentAttackStat ?? c.attackStat ?? 0), 0)
  const myTotalDef = (playerA.activeGoalkeeper
    ? (playerA.activeGoalkeeper.currentDefenseStat ?? playerA.activeGoalkeeper.defenseStat ?? 0) : 0)
    + playerA.defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? c.defenseStat ?? 0), 0)

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
          <span className={`msb-dot ${currentPlayer === 'B' ? 'msb-dot--on' : ''}`} />
          <span className="msb-name">{opponentName}</span>
        </div>
        <div className="msb-score">
          <span className={`msb-num ${displayScore.player > displayScore.ai ? 'msb-num--win' : ''}`}>
            {displayScore.player}
          </span>
          <span className="msb-sep">:</span>
          <span className={`msb-num ${displayScore.ai > displayScore.player ? 'msb-num--win' : ''}`}>
            {displayScore.ai}
          </span>
          <span className="msb-round">R{round}/10</span>
        </div>
        <div className="msb-side msb-side--right">
          <span className="msb-name">TY</span>
          <span className={`msb-dot ${currentPlayer === 'A' ? 'msb-dot--on' : ''}`} />
        </div>
      </div>

      {/* ── Stats matchup strip ─────────────────────────────────────────── */}
      <div className="ms-stats-strip">
        <div className={`mss-row ${myTotalAtk >= aiTotalDef ? 'mss-row--win' : 'mss-row--loss'}`}>
          <span className="mss-label">TY ⚔</span>
          <span className="mss-val mss-val--atk">{myTotalAtk}</span>
          <span className="mss-vs">vs</span>
          <span className="mss-val mss-val--def">{aiTotalDef}</span>
          <span className="mss-label">🛡 BOT</span>
        </div>
        <div className="mss-divider" />
        <div className={`mss-row ${aiTotalAtk >= myTotalDef ? 'mss-row--loss' : 'mss-row--win'}`}>
          <span className="mss-label">BOT ⚔</span>
          <span className="mss-val mss-val--atk">{aiTotalAtk}</span>
          <span className="mss-vs">vs</span>
          <span className="mss-val mss-val--def">{myTotalDef}</span>
          <span className="mss-label">🛡 TY</span>
        </div>
      </div>

      {/* ── Field ───────────────────────────────────────────────────────── */}
      <div className="ms-field-wrap">

        {/* === AI GOAL (top) === */}
        <div className="ms-goal ms-goal--ai">
          <GoalPosts side="ai" />
          <div className="ms-goal-inner">
            <div className="ms-stat-pill ms-stat-pill--atk">
              <span className="msp-lbl">ATK</span>
              <span className="msp-val">{aiTotalAtk}</span>
            </div>
            <GKCard
              card={playerB.activeGoalkeeper}
              side="ai"
              onTap={() => playerB.activeGoalkeeper && setZoomCard(playerB.activeGoalkeeper)}
            />
            <div className="ms-stat-pill ms-stat-pill--def">
              <span className="msp-lbl">DEF</span>
              <span className="msp-val">{aiTotalDef}</span>
            </div>
          </div>
          {aiThinking && <div className="ms-thinking">🤔 myśli...</div>}
        </div>

        {/* === AI FIELD === */}
        <div className="ms-half ms-half--ai">
          <Zone
            label="⚔ ATAK"
            cards={playerB.offenseSector}
            side="ai"
            onCardTap={(c) => setZoomCard(c)}
          />
          <div className="ms-zone-sep" />
          <Zone
            label="🛡 OBRONA"
            cards={playerB.defenseSector}
            side="ai"
            onCardTap={(c) => setZoomCard(c)}
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
            onCardLongPress={(c) => setZoomCard(c)}
            selectedId={fieldAction?.sector === 'defense' ? fieldAction.card.instanceId : null}
            isDropTarget={selectedCard && canPlaceInSector(selectedCard, 'defense') && !turnActionsUsed.placedDefense && playerA.defenseSector.length < MAX_SECTOR_SIZE}
            onDrop={() => placeCard('defense')}
            dragZoneActive={dragZone === 'defense'}
          />
          <div className="ms-zone-sep" />
          <Zone
            label="⚔ ATAK"
            cards={playerA.offenseSector}
            side="player"
            zone="offense"
            onCardTap={(c) => handleFieldTap(c, 'offense')}
            onCardLongPress={(c) => setZoomCard(c)}
            selectedId={fieldAction?.sector === 'offense' ? fieldAction.card.instanceId : null}
            isDropTarget={selectedCard && canPlaceInSector(selectedCard, 'offense') && !turnActionsUsed.placedOffense && playerA.offenseSector.length < MAX_SECTOR_SIZE}
            onDrop={() => placeCard('offense')}
            dragZoneActive={dragZone === 'offense'}
          />
        </div>

        {/* === PLAYER GOAL (bottom) === */}
        <div className="ms-goal ms-goal--player">
          <div className="ms-goal-inner">
            <div className="ms-stat-pill ms-stat-pill--atk">
              <span className="msp-lbl">ATK</span>
              <span className="msp-val">{myTotalAtk}</span>
            </div>
            <GKCard
              card={playerA.activeGoalkeeper}
              side="player"
              onTap={() => playerA.activeGoalkeeper && setZoomCard(playerA.activeGoalkeeper)}
            />
            <div className="ms-stat-pill ms-stat-pill--def">
              <span className="msp-lbl">DEF</span>
              <span className="msp-val">{myTotalDef}</span>
            </div>
          </div>
          <GoalPosts side="player" />
        </div>

      </div>{/* end ms-field-wrap */}

      {/* ── Field card action popup ──────────────────────────────────────── */}
      {fieldAction && isPlayerTurn && (
        <div className="ms-field-popup">
          <span className="msfp-name">{fieldAction.card.name}</span>
          <div className="msfp-btns">
            {!fieldAction.card.isLocked && !fieldAction.card.justPlaced
              && fieldAction.card.abilityType !== 'passive' && canActivate && (
              <button className="msfp-btn msfp-btn--activate" onClick={handleActivateField}>⚡ Aktywuj</button>
            )}
            <button className="msfp-btn msfp-btn--sub" onClick={handleSubstitute}>🔄 Zmiana</button>
            <button className="msfp-btn msfp-btn--info" onClick={() => setZoomCard(fieldAction.card)}>ℹ️</button>
            <button className="msfp-btn msfp-btn--cancel" onClick={() => setFieldAction(null)}>✕</button>
          </div>
        </div>
      )}

      {/* ── Hand ────────────────────────────────────────────────────────── */}
      <div className="ms-hand-area">
        {/* Placement hint when card selected */}
        {selectedCard && isPlayerTurn && !dragPos && (
          <div className="ms-place-hint">
            <span className="mph-name">{selectedCard.name}</span>
            {canPlaceInSector(selectedCard, 'offense') && !turnActionsUsed.placedOffense && playerA.offenseSector.length < MAX_SECTOR_SIZE && (
              <button className="mph-btn mph-btn--off" onClick={() => placeCard('offense')}>⚔ Atak</button>
            )}
            {canPlaceInSector(selectedCard, 'defense') && !turnActionsUsed.placedDefense && playerA.defenseSector.length < MAX_SECTOR_SIZE && (
              <button className="mph-btn mph-btn--def" onClick={() => placeCard('defense')}>🛡 Obrona</button>
            )}
            <button className="mph-btn mph-btn--x" onClick={() => setSelectedCard(null)}>✕</button>
          </div>
        )}

        <div className="ms-hand-scroll">
          {playerA.hand.map(card => (
            <FieldCard
              key={card.instanceId}
              card={card}
              selected={selectedCard?.instanceId === card.instanceId}
              dimmed={!!fieldAction}
              onTap={() => {
                if (!isPlayerTurn) return
                setFieldAction(null)
                setSelectedCard(prev => prev?.instanceId === card.instanceId ? null : (SFX.cardSelect(), card))
              }}
              onLongPress={() => setZoomCard(card)}
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
        </div>
        <button
          className={`ms-end-btn ${!isPlayerTurn ? 'ms-end-btn--wait' : ''}`}
          onClick={handleEndTurn}
          disabled={!isPlayerTurn || !!coinFlipState?.pending}
        >
          {!isPlayerTurn ? (aiThinking ? '🤔 Bot...' : '⏳ Tura bota') : '→ Zakończ turę'}
        </button>
      </div>

      {/* ── Drag ghost ──────────────────────────────────────────────────── */}
      {dragPos && selectedCard && (
        <div
          className="ms-drag-ghost"
          style={{ left: dragPos.x - 40, top: dragPos.y - 55 }}
        >
          <FieldCard card={selectedCard} />
        </div>
      )}

      {/* ── Notifications ───────────────────────────────────────────────── */}
      {notification && <div className="ms-notif">{notification}</div>}

      {/* ── Overlays ────────────────────────────────────────────────────── */}
      {coinFlipState && (
        <CoinFlip
          coinFlipState={coinFlipState}
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
      {zoomCard && <CardZoomModal card={zoomCard} onClose={() => setZoomCard(null)} />}

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
    text: 'Grasz kartami piłkarzy, by strzelać gole przeciwnikowi. Każda tura to walka ataku z obroną.',
  },
  {
    emoji: '🃏',
    title: 'Twoja ręka',
    text: 'Na dole ekranu są Twoje karty. Tapnij kartę, żeby ją wybrać — albo przeciągnij ją prosto na boisko.',
  },
  {
    emoji: '⚔',
    title: 'Strefa Ataku',
    text: 'Napastnicy i pomocnicy idą na ATAK. Im wyższy łączny ATK, tym większa szansa na gola!',
  },
  {
    emoji: '🛡',
    title: 'Strefa Obrony',
    text: 'Obrońcy i pomocnicy idą na OBRONĘ. Twój DEF chroni Cię przed atakiem przeciwnika.',
  },
  {
    emoji: '📊',
    title: 'Pasek statystyk',
    text: 'Pod tablicą wyników widać live porównanie: Twój ATK vs DEF bota i odwrotnie. Zielony = przewaga!',
  },
  {
    emoji: '→',
    title: 'Zakończ turę',
    text: 'Naciśnij "Zakończ turę". Bot zagra swoją turę, potem system wyliczy gole. Powodzenia!',
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
            <div
              key={i}
              className={`tut-dot ${i === step ? 'tut-dot--active' : i < step ? 'tut-dot--done' : ''}`}
            />
          ))}
        </div>
        <button
          className="tut-next"
          onClick={() => isLast ? onDone() : setStep(s => s + 1)}
        >
          {isLast ? '⚽ Zaczynamy!' : 'Dalej →'}
        </button>
        <button className="tut-skip" onClick={onDone}>Pomiń samouczek</button>
      </div>
    </div>
  )
}

// ── Zone sub-component ─────────────────────────────────────────────────────

function Zone({ label, cards, side, zone, onCardTap, onCardLongPress, selectedId, isDropTarget, onDrop, dragZoneActive }) {
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
            selected={selectedId === card.instanceId}
            faceDown={side === 'ai' && card.faceDown}
            isNew={card.justPlaced}
            onTap={() => onCardTap?.(card)}
            onLongPress={() => onCardLongPress?.(card)}
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
