import React, { useReducer, useEffect, useState, useCallback, useRef } from 'react'
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
import { SFX } from '../game/soundEngine'
import GoalAnimation from '../components/GoalAnimation'
import CoinFlip from '../components/CoinFlip'
import { SpecialCardModal } from '../components/SpecialCardModal'
import PlayerCard from '../components/PlayerCard'
import './MatchScreen.css'

const ALL_CARD_DEFS = [...CARD_DEFINITIONS, ...STARTER_CARD_DEFINITIONS]

function buildPlayerDeck(profile) {
  const deckIds = profile.activeDeck || profile.ownedCards.map(c => c.instanceId)
  const deckCards = profile.ownedCards.filter(c => deckIds.includes(c.instanceId))
  return createDeckFromOwned(deckCards, ALL_CARD_DEFS)
}

function buildAIDeck() {
  return createDefaultDeck('B')
}

// ── Card Detail Overlay ────────────────────────────────────────────────────

function CardDetailOverlay({ card, onClose }) {
  if (!card) return null
  const isGK = card.type === 'goalkeeper'
  const atkVal = card.currentAttackStat ?? card.attackStat ?? 0
  const defVal = card.currentDefenseStat ?? card.defenseStat ?? 0
  const RARITY_LABEL = { common: 'Normalny', rare: 'Rzadki', legendary: 'Legendarny', starter: 'Starter' }
  const TYPE_LABEL = { attack: 'Atak', midfield: 'Pomocnik', defense: 'Obrona', goalkeeper: 'Bramkarz' }
  return (
    <div className="card-detail-backdrop" onClick={onClose}>
      <div className="card-detail-panel" onClick={e => e.stopPropagation()}>
        <div className="card-detail-header" style={{ background: card.color || '#eee' }}>
          <span className="card-detail-type">{card.typeLabel}</span>
          <span className="card-detail-name">{card.name}</span>
          <span className="card-detail-rarity">{RARITY_LABEL[card.rarity] || card.rarity}</span>
        </div>
        <div className="card-detail-stats">
          <div className="card-detail-stat">
            <span className="cds-label">ATK</span>
            <span className="cds-val cds-val--atk">{atkVal}</span>
          </div>
          <div className="card-detail-stat">
            <span className="cds-label">DEF</span>
            <span className="cds-val cds-val--def">{defVal}</span>
          </div>
          <div className="card-detail-stat">
            <span className="cds-label">POS</span>
            <span className="cds-val">{TYPE_LABEL[card.type]}</span>
          </div>
        </div>
        <div className="card-detail-ability">
          <div className="card-detail-ability-name">{card.abilityName}</div>
          <div className="card-detail-ability-type">
            {card.abilityType === 'passive' ? '🔵 PASYWNA' : card.abilityType === 'active_coin' ? '🟡 AKTYWNA (ŻETON)' : '🟢 AKTYWNA'}
          </div>
          <div className="card-detail-ability-desc">{card.abilityDescription}</div>
          {card.noActivationDescription && card.abilityType !== 'passive' && (
            <div className="card-detail-noact">
              <span className="card-detail-noact-label">BRAK AKT:</span> {card.noActivationDescription}
            </div>
          )}
        </div>
        {card.upgradeLevel > 0 && (
          <div className="card-detail-upgrade">Ulepszenie: poziom {card.upgradeLevel}</div>
        )}
        <button className="card-detail-close" onClick={onClose}>✕ Zamknij</button>
      </div>
    </div>
  )
}

// ── MatchScreen ────────────────────────────────────────────────────────────

export default function MatchScreen({ matchParams = {} }) {
  const { replace } = useRouter()
  const { profile, addMatchResult } = useProfile()
  const { settings } = useSettings()

  const matchType = matchParams.matchType || 'local'
  const opponentName = matchParams.opponentName || 'BOT'

  const [matchState, dispatch] = useReducer(gameReducer, null, () => {
    const playerDeck = buildPlayerDeck(profile)
    const aiDeck = buildAIDeck()
    return createMatchState(matchType, playerDeck, aiDeck)
  })

  const [aiThinking, setAiThinking] = useState(false)
  const [goalAnim, setGoalAnim] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [fieldSelectedCard, setFieldSelectedCard] = useState(null) // card on field (for sub)
  const [notification, setNotification] = useState(null)
  const [detailCard, setDetailCard] = useState(null)
  const longPressRef = useRef(null)

  // ── Goalkeeper setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (matchState.phase !== 'goalkeeper_selection') return
    const aiPlayer = matchState.players.B
    if (!aiPlayer.activeGoalkeeper && matchState.players.A.activeGoalkeeper) {
      const aiGK = pickAIGoalkeeper(aiPlayer.goalkeepers)
      setTimeout(() => {
        dispatch({ type: 'SELECT_GOALKEEPER', playerId: 'B', gkInstanceId: aiGK.instanceId })
      }, 500)
    }
  }, [matchState.phase, matchState.players.A.activeGoalkeeper, matchState.players.B.activeGoalkeeper])

  // SFX on match start
  useEffect(() => {
    if (matchState.phase === 'playing' && matchState.round === 1) {
      SFX.matchStart()
    }
  }, [matchState.phase])

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

  // ── Game end ──────────────────────────────────────────────────────────────
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
    if (result === 'win') SFX.matchEnd()
    addMatchResult({ type: result, matchType, score, coinsEarned: coins, ratingChange })
    setTimeout(() => {
      replace('post_match', { result, score, matchType, coinsEarned: coins, ratingChange, goalEvents: matchState.goalEvents, playerOfMatch, log: matchState.log })
    }, 800)
  }, [matchState.phase])

  // ── Goal detection ────────────────────────────────────────────────────────
  const prevScoreRef = useRef(matchState.displayScore)
  useEffect(() => {
    const prev = prevScoreRef.current
    const curr = matchState.displayScore
    if (curr.player > prev.player) {
      setGoalAnim({ scorer: 'player', score: curr })
      SFX.goalPlayer()
    } else if (curr.ai > prev.ai) {
      setGoalAnim({ scorer: 'ai', score: curr })
      SFX.goalAI()
    }
    prevScoreRef.current = curr
  }, [matchState.displayScore.player, matchState.displayScore.ai])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEndTurn = useCallback(() => {
    if (matchState.currentPlayer !== 'A') return
    if (matchState.coinFlipState?.pending) return
    SFX.endTurn()
    dispatch({ type: 'END_TURN' })
  }, [matchState])

  const handleCardSelect = (card) => {
    if (matchState.currentPlayer !== 'A') return
    if (matchState.phase !== 'playing') return
    setFieldSelectedCard(null)
    if (selectedCard?.instanceId === card.instanceId) {
      setSelectedCard(null)
    } else {
      SFX.cardSelect()
      setSelectedCard(card)
    }
  }

  const handleFieldCardTap = (card, sector) => {
    if (matchState.currentPlayer !== 'A') return
    if (matchState.phase !== 'playing') return
    setSelectedCard(null)
    if (fieldSelectedCard?.card?.instanceId === card.instanceId) {
      setFieldSelectedCard(null)
    } else {
      SFX.cardSelect()
      setFieldSelectedCard({ card, sector })
    }
  }

  const handleSubstitute = () => {
    if (!fieldSelectedCard) return
    dispatch({ type: 'SUBSTITUTE_CARD', playerId: 'A', cardInstanceId: fieldSelectedCard.card.instanceId, sector: fieldSelectedCard.sector })
    SFX.substitution()
    setFieldSelectedCard(null)
  }

  const handleActivateField = (instanceId) => {
    if (matchState.turnActionsUsed.activatedAbility) {
      showNotif('Już aktywowano umiejętność tej tury.')
      return
    }
    SFX.activateAbility()
    dispatch({ type: 'ACTIVATE_ABILITY', playerId: 'A', cardInstanceId: instanceId })
    setFieldSelectedCard(null)
  }

  const handlePlaceCard = (sector) => {
    if (!selectedCard) return
    if (!canPlaceInSector(selectedCard, sector)) {
      showNotif(`${selectedCard.name} nie pasuje do ${sector === 'offense' ? 'ofensywy' : 'defensywy'}!`)
      SFX.error()
      return
    }
    const actionKey = sector === 'offense' ? 'placedOffense' : 'placedDefense'
    if (matchState.turnActionsUsed[actionKey]) {
      showNotif('Już wystawiłeś kartę w tym sektorze tej tury.')
      SFX.error()
      return
    }
    const sectorCards = matchState.players.A[sector === 'offense' ? 'offenseSector' : 'defenseSector']
    if (sectorCards.length >= MAX_SECTOR_SIZE) {
      showNotif('Sektor pełny! (max 3 zawodników)')
      SFX.error()
      return
    }
    SFX.cardPlace()
    dispatch({ type: 'PLACE_CARD', playerId: 'A', cardInstanceId: selectedCard.instanceId, sector })
    setSelectedCard(null)
  }

  const showNotif = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 2500)
  }

  // Long press for card detail
  const handleCardLongPress = (card) => {
    setDetailCard(card)
  }

  const makeLongPressHandlers = (card) => ({
    onTouchStart: () => {
      longPressRef.current = setTimeout(() => handleCardLongPress(card), 500)
    },
    onTouchEnd: () => {
      if (longPressRef.current) clearTimeout(longPressRef.current)
    },
    onTouchMove: () => {
      if (longPressRef.current) clearTimeout(longPressRef.current)
    },
  })

  const { phase, round, currentPlayer, players, displayScore, turnActionsUsed, coinFlipState, specialCard } = matchState
  const playerA = players.A
  const playerB = players.B
  const isPlayerTurn = currentPlayer === 'A' && phase === 'playing'
  const canActivate = isPlayerTurn && !turnActionsUsed.activatedAbility && !coinFlipState

  // ── Goalkeeper selection ──────────────────────────────────────────────────
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

  const offenseEmpty = !turnActionsUsed.placedOffense && playerA.offenseSector.length < MAX_SECTOR_SIZE
  const defenseEmpty = !turnActionsUsed.placedDefense && playerA.defenseSector.length < MAX_SECTOR_SIZE

  return (
    <div className="match-screen">
      {/* ── Scoreboard ──────────────────────────────────────────────────── */}
      <div className="match-scoreboard">
        <div className="sb-team sb-team--left">
          <span className={`sb-dot ${currentPlayer === 'B' ? 'sb-dot--active' : ''}`} />
          <span className="sb-team-name">{opponentName}</span>
        </div>
        <div className="sb-center">
          <span className={`score-num ${displayScore.player > displayScore.ai ? 'score-num--winning' : ''}`}>
            {displayScore.player}
          </span>
          <span className="score-sep">:</span>
          <span className={`score-num ${displayScore.ai > displayScore.player ? 'score-num--winning' : ''}`}>
            {displayScore.ai}
          </span>
          <span className="score-round">R{round}/10</span>
        </div>
        <div className="sb-team sb-team--right">
          <span className="sb-team-name">TY</span>
          <span className={`sb-dot ${currentPlayer === 'A' ? 'sb-dot--active' : ''}`} />
        </div>
      </div>

      {/* ── AI zone (TOP) ───────────────────────────────────────────────── */}
      <div className="match-zone match-zone--ai">
        {/* AI goalkeeper */}
        <div className="match-gk-row match-gk-row--ai">
          {playerB.activeGoalkeeper ? (
            <div
              className="match-gk-card"
              style={{ background: playerB.activeGoalkeeper.color || '#cfd8dc' }}
              onClick={() => setDetailCard(playerB.activeGoalkeeper)}
            >
              <span className="mgk-label">B</span>
              <span className="mgk-name">{playerB.activeGoalkeeper.name}</span>
              <span className="mgk-def">🛡 {playerB.activeGoalkeeper.currentDefenseStat ?? playerB.activeGoalkeeper.defenseStat}</span>
            </div>
          ) : <div className="match-gk-empty">—</div>}
          {aiThinking && <div className="ai-thinking">🤔</div>}
        </div>

        {/* AI sectors */}
        <div className="match-sectors match-sectors--ai">
          <FieldSector
            label="⚔ OF"
            cards={playerB.offenseSector}
            side="ai"
            onCardDetail={setDetailCard}
          />
          <div className="sector-divider" />
          <FieldSector
            label="🛡 DEF"
            cards={playerB.defenseSector}
            side="ai"
            onCardDetail={setDetailCard}
          />
        </div>
      </div>

      {/* ── Midfield ────────────────────────────────────────────────────── */}
      <div className="match-midfield">
        <div className="midfield-line" />
        <div className="midfield-ball">⚽</div>
        <div className="midfield-line" />
      </div>

      {/* ── Player zone (BOTTOM) ────────────────────────────────────────── */}
      <div className="match-zone match-zone--player">
        {/* Player sectors */}
        <div className="match-sectors match-sectors--player">
          <FieldSector
            label="🛡 DEF"
            cards={playerA.defenseSector}
            side="player"
            onCardClick={isPlayerTurn ? (card) => handleFieldCardTap(card, 'defense') : null}
            onCardDetail={setDetailCard}
            selectedInstanceId={fieldSelectedCard?.sector === 'defense' ? fieldSelectedCard?.card?.instanceId : null}
            placingCard={selectedCard && canPlaceInSector(selectedCard, 'defense') && defenseEmpty}
            onSectorDrop={selectedCard && canPlaceInSector(selectedCard, 'defense') && defenseEmpty
              ? () => handlePlaceCard('defense')
              : null}
            makeLongPressHandlers={makeLongPressHandlers}
          />
          <div className="sector-divider" />
          <FieldSector
            label="⚔ OF"
            cards={playerA.offenseSector}
            side="player"
            onCardClick={isPlayerTurn ? (card) => handleFieldCardTap(card, 'offense') : null}
            onCardDetail={setDetailCard}
            selectedInstanceId={fieldSelectedCard?.sector === 'offense' ? fieldSelectedCard?.card?.instanceId : null}
            placingCard={selectedCard && canPlaceInSector(selectedCard, 'offense') && offenseEmpty}
            onSectorDrop={selectedCard && canPlaceInSector(selectedCard, 'offense') && offenseEmpty
              ? () => handlePlaceCard('offense')
              : null}
            makeLongPressHandlers={makeLongPressHandlers}
          />
        </div>

        {/* Player goalkeeper */}
        <div className="match-gk-row match-gk-row--player">
          {playerA.activeGoalkeeper ? (
            <div
              className="match-gk-card"
              style={{ background: playerA.activeGoalkeeper.color || '#cfd8dc' }}
              onClick={() => setDetailCard(playerA.activeGoalkeeper)}
            >
              <span className="mgk-label">B</span>
              <span className="mgk-name">{playerA.activeGoalkeeper.name}</span>
              <span className="mgk-def">🛡 {playerA.activeGoalkeeper.currentDefenseStat ?? playerA.activeGoalkeeper.defenseStat}</span>
            </div>
          ) : <div className="match-gk-empty">—</div>}
          <div className="match-deck-count">
            🃏 {playerA.deck.length}
          </div>
        </div>
      </div>

      {/* ── Field card action popup (sub / activate) ─────────────────────── */}
      {fieldSelectedCard && isPlayerTurn && (
        <div className="field-action-bar">
          <span className="field-action-name">{fieldSelectedCard.card.name}</span>
          <div className="field-action-buttons">
            {!fieldSelectedCard.card.isLocked && !fieldSelectedCard.card.justPlaced
              && fieldSelectedCard.card.abilityType !== 'passive' && canActivate && (
              <button className="fab fab--activate" onClick={() => handleActivateField(fieldSelectedCard.card.instanceId)}>
                ⚡ Aktywuj
              </button>
            )}
            <button className="fab fab--sub" onClick={handleSubstitute}>
              🔄 Zmiana
            </button>
            <button className="fab fab--info" onClick={() => setDetailCard(fieldSelectedCard.card)}>
              ℹ️
            </button>
            <button className="fab fab--cancel" onClick={() => setFieldSelectedCard(null)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Hand ────────────────────────────────────────────────────────── */}
      <div className="match-hand-area">
        {/* Placement hint */}
        {selectedCard && isPlayerTurn && (
          <div className="placement-hint">
            <span className="ph-name">{selectedCard.name} →</span>
            {canPlaceInSector(selectedCard, 'offense') && offenseEmpty && (
              <button className="ph-btn ph-btn--off" onClick={() => handlePlaceCard('offense')}>⚔ OF</button>
            )}
            {canPlaceInSector(selectedCard, 'defense') && defenseEmpty && (
              <button className="ph-btn ph-btn--def" onClick={() => handlePlaceCard('defense')}>🛡 DEF</button>
            )}
            <button className="ph-btn ph-btn--cancel" onClick={() => setSelectedCard(null)}>✕</button>
          </div>
        )}

        <div className="hand-scroll">
          {playerA.hand.map(card => (
            <div
              key={card.instanceId}
              className={`hand-card-wrap ${selectedCard?.instanceId === card.instanceId ? 'hand-card-wrap--selected' : ''}`}
              onClick={() => handleCardSelect(card)}
              {...makeLongPressHandlers(card)}
            >
              <PlayerCard
                card={card}
                size="small"
                selected={selectedCard?.instanceId === card.instanceId}
              />
            </div>
          ))}
          {playerA.hand.length === 0 && (
            <div className="hand-empty">Brak kart w ręce</div>
          )}
        </div>
      </div>

      {/* ── Action bar ───────────────────────────────────────────────────── */}
      <div className="match-action-bar">
        <div className="action-chips">
          {turnActionsUsed.placedOffense && <span className="chip chip--done">✓ OF</span>}
          {turnActionsUsed.placedDefense && <span className="chip chip--done">✓ DEF</span>}
          {turnActionsUsed.activatedAbility && <span className="chip chip--done">✓ Skill</span>}
          {!turnActionsUsed.placedOffense && isPlayerTurn && <span className="chip chip--todo">OF</span>}
          {!turnActionsUsed.placedDefense && isPlayerTurn && <span className="chip chip--todo">DEF</span>}
        </div>
        <button
          className={`end-turn-btn ${!isPlayerTurn ? 'end-turn-btn--wait' : ''}`}
          onClick={handleEndTurn}
          disabled={!isPlayerTurn || !!coinFlipState?.pending}
        >
          {!isPlayerTurn
            ? (aiThinking ? '🤔 Bot...' : '⏳ Tura bota')
            : '→ Zakończ turę'}
        </button>
      </div>

      {/* ── Notification ─────────────────────────────────────────────────── */}
      {notification && (
        <div className="match-notif">{notification}</div>
      )}

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      {coinFlipState && (
        <CoinFlip
          coinFlipState={coinFlipState}
          onFlip={() => { SFX.coinFlip(); dispatch({ type: 'FLIP_COIN' }) }}
          onDismiss={() => dispatch({ type: 'DISMISS_COIN' })}
        />
      )}

      {phase === 'special_card' && specialCard && (
        <SpecialCardModal
          card={specialCard}
          onDismiss={() => dispatch({ type: 'DISMISS_SPECIAL_CARD' })}
        />
      )}

      {goalAnim && settings.visualEffects !== false && (
        <GoalAnimation
          scorer={goalAnim.scorer}
          score={goalAnim.score}
          onDone={() => setGoalAnim(null)}
        />
      )}

      {detailCard && (
        <CardDetailOverlay card={detailCard} onClose={() => setDetailCard(null)} />
      )}
    </div>
  )
}

// ── FieldSector ───────────────────────────────────────────────────────────

function FieldSector({ label, cards, side, onCardClick, onSectorDrop, placingCard, selectedInstanceId, onCardDetail, makeLongPressHandlers }) {
  return (
    <div
      className={[
        'field-sector',
        `field-sector--${side}`,
        placingCard ? 'field-sector--drop' : '',
      ].filter(Boolean).join(' ')}
      onClick={!onCardClick && onSectorDrop ? onSectorDrop : undefined}
    >
      <div className="fs-label">{label}</div>
      <div className="fs-cards">
        {cards.map(card => (
          <div
            key={card.instanceId}
            className={[
              'fs-card-wrap',
              selectedInstanceId === card.instanceId ? 'fs-card-wrap--selected' : '',
              card.isLocked ? 'fs-card-wrap--locked' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onCardClick ? onCardClick(card) : (onSectorDrop ? onSectorDrop() : null)}
            {...(makeLongPressHandlers ? makeLongPressHandlers(card) : {})}
          >
            {side === 'ai' && card.faceDown ? (
              <div className="fs-card-back">⚽</div>
            ) : (
              <div className="fs-card-mini" style={{ background: card.color || '#eee' }}>
                <span className="fs-card-type">{card.typeLabel}</span>
                <span className="fs-card-name">{card.name}</span>
                <div className="fs-card-stats">
                  <span className="fs-stat fs-stat--atk">{card.currentAttackStat ?? card.attackStat}</span>
                  <span className="fs-stat-sep">/</span>
                  <span className="fs-stat fs-stat--def">{card.currentDefenseStat ?? card.defenseStat}</span>
                </div>
                {card.isLocked && <div className="fs-locked">🔒</div>}
                {card.justPlaced && <div className="fs-new">NEW</div>}
              </div>
            )}
          </div>
        ))}
        {cards.length < MAX_SECTOR_SIZE && placingCard && (
          <div className="fs-drop-slot" onClick={onSectorDrop}>+</div>
        )}
        {cards.length === 0 && !placingCard && (
          <div className="fs-empty">—</div>
        )}
      </div>
    </div>
  )
}
