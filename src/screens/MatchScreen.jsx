import React, { useReducer, useEffect, useState, useCallback } from 'react'
import { useRouter } from '../router/AppRouter'
import { useProfile, useSettings } from '../App'
import {
  createMatchState,
  gameReducer,
  selectGoalkeeper,
  endTurn,
  canPlaceInSector,
  MAX_SECTOR_SIZE,
} from '../game/gameEngine'
import { runAITurn, pickAIGoalkeeper } from '../game/aiEngine'
import { computeRewardCoins, computeRatingChange, determinePlayerOfMatch } from '../game/scoreEngine'
import { createDeckFromOwned, CARD_DEFINITIONS, createDefaultDeck } from '../data/cards'
import { STARTER_CARD_DEFINITIONS } from '../data/starterRoster'

const ALL_CARD_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]
import GoalAnimation from '../components/GoalAnimation'
import CoinFlip from '../components/CoinFlip'
import { SpecialCardModal } from '../components/SpecialCardModal'
import PlayerCard from '../components/PlayerCard'
import './MatchScreen.css'

// ── helpers ────────────────────────────────────────────────────────────────

function buildPlayerDeck(profile) {
  const deckIds = profile.activeDeck || profile.ownedCards.map(c => c.instanceId)
  const deckCards = profile.ownedCards.filter(c => deckIds.includes(c.instanceId))
  return createDeckFromOwned(deckCards, ALL_CARD_DEFS)
}

function buildAIDeck() {
  return createDefaultDeck('B')
}

// ── MatchScreen ────────────────────────────────────────────────────────────

export default function MatchScreen({ matchParams = {} }) {
  const { replace } = useRouter()
  const { profile, addMatchResult } = useProfile()
  const { settings } = useSettings()

  const matchType = matchParams.matchType || 'local'

  const [matchState, dispatch] = useReducer(gameReducer, null, () => {
    const playerDeck = buildPlayerDeck(profile)
    const aiDeck = buildAIDeck()
    return createMatchState(matchType, playerDeck, aiDeck)
  })

  const [aiThinking, setAiThinking] = useState(false)
  const [goalAnim, setGoalAnim] = useState(null) // { scorer, score }
  const [selectedCard, setSelectedCard] = useState(null)
  const [notification, setNotification] = useState(null)

  // ── Goalkeeper setup: player picks first, then AI picks ──────────────────
  useEffect(() => {
    if (matchState.phase !== 'goalkeeper_selection') return
    const aiPlayer = matchState.players.B
    // If AI hasn't picked yet and player A already picked
    if (!aiPlayer.activeGoalkeeper && matchState.players.A.activeGoalkeeper) {
      const aiGK = pickAIGoalkeeper(aiPlayer.goalkeepers)
      setTimeout(() => {
        dispatch({ type: 'SELECT_GOALKEEPER', playerId: 'B', gkInstanceId: aiGK.instanceId })
      }, 500)
    }
  }, [matchState.phase, matchState.players.A.activeGoalkeeper, matchState.players.B.activeGoalkeeper])

  // ── AI turn ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'playing') return
    if (matchState.currentPlayer !== 'B') return
    if (aiThinking) return

    const timer = setTimeout(() => {
      runAITurn(matchState, dispatch, setAiThinking)
    }, 400)
    return () => clearTimeout(timer)
  }, [matchState.currentPlayer, matchState.phase, matchState.round])

  // ── Check for game end ────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'ended') return
    const score = matchState.displayScore
    const result = score.player > score.ai ? 'win' : score.ai > score.player ? 'loss' : 'draw'
    const scoreDiff = Math.abs(score.player - score.ai)
    const coins = computeRewardCoins(result, matchType, scoreDiff)
    const ratingChange = computeRatingChange(result)
    const playerOfMatch = determinePlayerOfMatch(
      matchState.goalEvents,
      { offense: matchState.players.A.offenseSector, defense: matchState.players.A.defenseSector },
      {}
    )
    addMatchResult({ type: result, matchType, score, coinsEarned: coins, ratingChange })
    setTimeout(() => {
      replace('post_match', {
        result,
        score,
        matchType,
        coinsEarned: coins,
        ratingChange,
        goalEvents: matchState.goalEvents,
        playerOfMatch,
        log: matchState.log,
      })
    }, 800)
  }, [matchState.phase])

  // ── Handle END_TURN with goal detection ───────────────────────────────────
  const handleEndTurn = useCallback(() => {
    if (matchState.currentPlayer !== 'A') return
    if (matchState.coinFlipState?.pending) return
    const prevScore = matchState.displayScore

    // We peek at what goal result will be via the reducer (but can't easily)
    // Instead, after dispatch, compare scores
    dispatch({ type: 'END_TURN' })
  }, [matchState])

  // Detect score changes for goal animation
  const prevScoreRef = React.useRef(matchState.displayScore)
  useEffect(() => {
    const prev = prevScoreRef.current
    const curr = matchState.displayScore
    if (curr.player > prev.player) {
      setGoalAnim({ scorer: 'player', score: curr })
    } else if (curr.ai > prev.ai) {
      setGoalAnim({ scorer: 'ai', score: curr })
    }
    prevScoreRef.current = curr
  }, [matchState.displayScore.player, matchState.displayScore.ai])

  // ── Card placement ────────────────────────────────────────────────────────
  const handleCardSelect = (card) => {
    if (matchState.currentPlayer !== 'A') return
    if (matchState.phase !== 'playing') return
    setSelectedCard(prev => prev?.instanceId === card.instanceId ? null : card)
  }

  const handlePlaceCard = (sector) => {
    if (!selectedCard) return
    if (!canPlaceInSector(selectedCard, sector)) {
      showNotif(`${selectedCard.name} nie pasuje do ${sector === 'offense' ? 'ofensywy' : 'defensywy'}!`)
      return
    }
    const actionKey = sector === 'offense' ? 'placedOffense' : 'placedDefense'
    if (matchState.turnActionsUsed[actionKey]) {
      showNotif('Już wystawiłeś kartę w tym sektorze tej tury.')
      return
    }
    if (matchState.players.A[sector === 'offense' ? 'offenseSector' : 'defenseSector'].length >= MAX_SECTOR_SIZE) {
      showNotif('Sektor pełny! (max 3 zawodników)')
      return
    }
    dispatch({ type: 'PLACE_CARD', playerId: 'A', cardInstanceId: selectedCard.instanceId, sector })
    setSelectedCard(null)
  }

  const handleActivate = (instanceId) => {
    if (matchState.turnActionsUsed.activatedAbility) {
      showNotif('Już aktywowano umiejętność tej tury.')
      return
    }
    dispatch({ type: 'ACTIVATE_ABILITY', playerId: 'A', cardInstanceId: instanceId })
  }

  const showNotif = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
  }

  const { phase, round, currentPlayer, players, displayScore, turnActionsUsed, coinFlipState, specialCard } = matchState
  const playerA = players.A
  const playerB = players.B
  const isPlayerTurn = currentPlayer === 'A' && phase === 'playing'
  const canActivate = isPlayerTurn && !turnActionsUsed.activatedAbility && !coinFlipState

  // ── Goalkeeper selection screen ───────────────────────────────────────────
  if (phase === 'goalkeeper_selection') {
    return (
      <div className="match-gk-select">
        <div className="match-gk-header">
          <h2>Wybierz Bramkarza</h2>
          <p>Drugi trafi do rezerwy</p>
        </div>
        <div className="match-gk-cards">
          {playerA.goalkeepers.map(gk => (
            <div key={gk.instanceId} className="match-gk-option">
              <PlayerCard card={gk} size="normal" />
              <button
                className="match-gk-pick-btn"
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
      <div className="match-scoreboard">
        <div className="match-scoreboard-left">
          <span className="sb-label">BOT</span>
          <span className={`sb-turn-dot ${currentPlayer === 'B' ? 'sb-turn-dot--active' : ''}`} />
        </div>
        <div className="match-score">
          <span className={`score-num ${displayScore.player > displayScore.ai ? 'score-num--winning' : ''}`}>
            {displayScore.player}
          </span>
          <span className="score-sep">:</span>
          <span className={`score-num ${displayScore.ai > displayScore.player ? 'score-num--winning' : ''}`}>
            {displayScore.ai}
          </span>
        </div>
        <div className="match-scoreboard-right">
          <span className={`sb-turn-dot ${currentPlayer === 'A' ? 'sb-turn-dot--active' : ''}`} />
          <span className="sb-label">TY</span>
        </div>
        <div className="match-round">Runda {round}/10</div>
      </div>

      {/* ── AI area (top) ────────────────────────────────────────────────── */}
      <div className="match-ai-area">
        {/* AI goalkeeper */}
        <div className="match-gk-strip match-gk-strip--ai">
          {playerB.activeGoalkeeper ? (
            <div className="match-gk-pill">
              <span className="match-gk-name">{playerB.activeGoalkeeper.name}</span>
              <span className="match-gk-stat">🛡 {playerB.activeGoalkeeper.currentDefenseStat ?? playerB.activeGoalkeeper.defenseStat}</span>
            </div>
          ) : null}
          {aiThinking && <div className="ai-thinking-badge">🤔 Myśli...</div>}
        </div>

        {/* AI field sectors */}
        <div className="match-field match-field--ai">
          <Sector
            label="⚔️ OFENSYWA"
            cards={playerB.offenseSector}
            side="ai"
            size="small"
          />
          <Sector
            label="🛡️ DEFENSYWA"
            cards={playerB.defenseSector}
            side="ai"
            size="small"
          />
        </div>
      </div>

      {/* ── Midfield line ────────────────────────────────────────────────── */}
      <div className="match-midfield">
        <div className="midfield-line" />
        <div className="midfield-circle">⚽</div>
        <div className="midfield-line" />
      </div>

      {/* ── Player area (bottom) ─────────────────────────────────────────── */}
      <div className="match-player-area">
        {/* Player field sectors */}
        <div className="match-field match-field--player">
          <Sector
            label="🛡️ DEFENSYWA"
            cards={playerA.defenseSector}
            side="player"
            size="small"
            onCardClick={null}
            onActivate={handleActivate}
            canActivate={canActivate}
            isPlayerTurn={isPlayerTurn}
            onSectorClick={selectedCard && canPlaceInSector(selectedCard, 'defense') && !turnActionsUsed.placedDefense
              ? () => handlePlaceCard('defense')
              : null}
            placingCard={selectedCard && canPlaceInSector(selectedCard, 'defense')}
          />
          <Sector
            label="⚔️ OFENSYWA"
            cards={playerA.offenseSector}
            side="player"
            size="small"
            onActivate={handleActivate}
            canActivate={canActivate}
            isPlayerTurn={isPlayerTurn}
            onSectorClick={selectedCard && canPlaceInSector(selectedCard, 'offense') && !turnActionsUsed.placedOffense
              ? () => handlePlaceCard('offense')
              : null}
            placingCard={selectedCard && canPlaceInSector(selectedCard, 'offense')}
          />
        </div>

        {/* Player goalkeeper */}
        <div className="match-gk-strip match-gk-strip--player">
          {playerA.activeGoalkeeper ? (
            <div className="match-gk-pill">
              <span className="match-gk-name">{playerA.activeGoalkeeper.name}</span>
              <span className="match-gk-stat">🛡 {playerA.activeGoalkeeper.currentDefenseStat ?? playerA.activeGoalkeeper.defenseStat}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Player hand ──────────────────────────────────────────────────── */}
      <div className="match-hand-area">
        <div className="match-hand-scroll">
          {playerA.hand.map(card => (
            <PlayerCard
              key={card.instanceId}
              card={card}
              size="small"
              onClick={() => handleCardSelect(card)}
              selected={selectedCard?.instanceId === card.instanceId}
            />
          ))}
          {playerA.hand.length === 0 && (
            <div className="match-hand-empty">Brak kart</div>
          )}
        </div>

        {/* Selected card placement prompt */}
        {selectedCard && isPlayerTurn && (
          <div className="match-place-prompt">
            <span className="place-prompt-name">{selectedCard.name}</span>
            <div className="place-prompt-buttons">
              {canPlaceInSector(selectedCard, 'offense') && !turnActionsUsed.placedOffense && playerA.offenseSector.length < MAX_SECTOR_SIZE && (
                <button className="place-btn place-btn--off" onClick={() => handlePlaceCard('offense')}>⚔ Ofensywa</button>
              )}
              {canPlaceInSector(selectedCard, 'defense') && !turnActionsUsed.placedDefense && playerA.defenseSector.length < MAX_SECTOR_SIZE && (
                <button className="place-btn place-btn--def" onClick={() => handlePlaceCard('defense')}>🛡 Defensywa</button>
              )}
              <button className="place-btn place-btn--cancel" onClick={() => setSelectedCard(null)}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action bar ───────────────────────────────────────────────────── */}
      <div className="match-action-bar">
        <div className="action-bar-badges">
          {turnActionsUsed.placedOffense && <span className="action-badge">✓ Ofensywa</span>}
          {turnActionsUsed.placedDefense && <span className="action-badge">✓ Defensywa</span>}
          {turnActionsUsed.activatedAbility && <span className="action-badge">✓ Umiejętność</span>}
        </div>
        <button
          className={`end-turn-btn ${!isPlayerTurn ? 'end-turn-btn--disabled' : ''}`}
          onClick={handleEndTurn}
          disabled={!isPlayerTurn || !!coinFlipState?.pending}
        >
          {!isPlayerTurn ? (aiThinking ? '🤔 Bot myśli...' : 'Tura bota') : 'Zakończ turę →'}
        </button>
      </div>

      {/* ── Notification ─────────────────────────────────────────────────── */}
      {notification && (
        <div className="match-notification">{notification}</div>
      )}

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      {coinFlipState && (
        <CoinFlip
          coinFlipState={coinFlipState}
          onFlip={() => dispatch({ type: 'FLIP_COIN' })}
          onDismiss={() => dispatch({ type: 'DISMISS_COIN' })}
        />
      )}

      {phase === 'special_card' && specialCard && (
        <SpecialCardModal
          card={specialCard}
          onDismiss={() => dispatch({ type: 'DISMISS_SPECIAL_CARD' })}
        />
      )}

      {goalAnim && settings.visualEffects && (
        <GoalAnimation
          scorer={goalAnim.scorer}
          score={goalAnim.score}
          onDone={() => setGoalAnim(null)}
        />
      )}
    </div>
  )
}

// ── Sector sub-component ───────────────────────────────────────────────────

function Sector({ label, cards, side, size, onActivate, canActivate, isPlayerTurn, onSectorClick, placingCard }) {
  const isEmpty = cards.length === 0
  const totalStat = side === 'player'
    ? cards.reduce((s, c) => s + (c.currentAttackStat ?? 0) + (c.currentDefenseStat ?? 0), 0)
    : cards.reduce((s, c) => s + (c.currentAttackStat ?? 0) + (c.currentDefenseStat ?? 0), 0)

  return (
    <div
      className={[
        'match-sector',
        `match-sector--${side}`,
        onSectorClick ? 'match-sector--droptarget' : '',
        placingCard ? 'match-sector--highlight' : '',
      ].filter(Boolean).join(' ')}
      onClick={onSectorClick}
    >
      <div className="sector-label">{label}</div>
      <div className="sector-cards">
        {cards.map(card => (
          <PlayerCard
            key={card.instanceId}
            card={card}
            size={size}
            showBack={side === 'ai' && card.faceDown}
            onActivate={onActivate}
            canActivate={canActivate}
            isCurrentPlayer={isPlayerTurn}
            showActivateBtn={side === 'player'}
          />
        ))}
        {cards.length < MAX_SECTOR_SIZE && onSectorClick && (
          <div className="sector-empty-slot">
            <span>+</span>
          </div>
        )}
        {isEmpty && !onSectorClick && (
          <div className="sector-placeholder">—</div>
        )}
      </div>
    </div>
  )
}
