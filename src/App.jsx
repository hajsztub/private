import React, { useState, useCallback } from 'react'
import SetupPhase from './components/SetupPhase'
import GameBoard from './components/GameBoard'
import Hand from './components/Hand'
import GameLog from './components/GameLog'
import CoinFlip from './components/CoinFlip'
import SpecialCardModal from './components/SpecialCardModal'
import EndGame from './components/EndGame'
import {
  createInitialState,
  selectGoalkeeper,
  placeCard,
  activateAbility,
  flipCoin,
  endTurn,
  dismissSpecialCard,
} from './game/gameEngine'
import './App.css'

export default function App() {
  const [state, setState] = useState(() => createInitialState())

  const dispatch = useCallback((action) => {
    setState((prev) => {
      switch (action.type) {
        case 'SELECT_GOALKEEPER': {
          return selectGoalkeeper(prev, action.playerId, action.gkInstanceId)
        }
        case 'PLACE_CARD': {
          const { state: next, error } = placeCard(prev, action.playerId, action.cardInstanceId, action.sector)
          if (error) { console.warn(error); return prev }
          return next
        }
        case 'ACTIVATE_ABILITY': {
          const { state: next, error } = activateAbility(prev, action.playerId, action.cardInstanceId)
          if (error) { console.warn(error); return prev }
          return next
        }
        case 'FLIP_COIN': {
          const { state: next, error } = flipCoin(prev)
          if (error) { console.warn(error); return prev }
          return next
        }
        case 'DISMISS_COIN': {
          return { ...prev, coinFlipState: null }
        }
        case 'END_TURN': {
          const { state: next, error } = endTurn(prev)
          if (error) { console.warn(error); return prev }
          return next
        }
        case 'DISMISS_SPECIAL_CARD': {
          return dismissSpecialCard(prev)
        }
        case 'RESTART': {
          return createInitialState()
        }
        default:
          return prev
      }
    })
  }, [])

  const { phase, currentPlayer, round, turnActionsUsed, coinFlipState, specialCard, log } = state

  if (phase === 'setup' || phase === 'goalkeeper_selection') {
    return (
      <SetupPhase
        state={state}
        onSelectGoalkeeper={(pid, gkId) => dispatch({ type: 'SELECT_GOALKEEPER', playerId: pid, gkInstanceId: gkId })}
      />
    )
  }

  if (phase === 'ended') {
    return <EndGame state={state} onRestart={() => dispatch({ type: 'RESTART' })} />
  }

  const canActivate = !turnActionsUsed.activatedAbility && !coinFlipState

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">⚽ Football Cards</div>
        <div className="app-header__info">
          <span className="header-badge header-badge--round">Runda {round} / 10</span>
          <span className={`header-badge header-badge--player header-badge--player-${currentPlayer}`}>
            Tura: Gracz {currentPlayer}
          </span>
        </div>
        <div className="app-header__actions">
          {turnActionsUsed.placedOffense && <span className="action-done">✓ Ofensywa</span>}
          {turnActionsUsed.placedDefense && <span className="action-done">✓ Defensywa</span>}
          {turnActionsUsed.activatedAbility && <span className="action-done">✓ Umiejętność</span>}
          <button
            className="end-turn-btn"
            onClick={() => dispatch({ type: 'END_TURN' })}
          >
            Zakończ Turę →
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="app-main">
        {/* Left: Player A hand */}
        <aside className="app-sidebar app-sidebar--left">
          <Hand
            cards={state.players.A.hand}
            playerId="A"
            currentPlayer={currentPlayer}
            onPlaceCard={(cardId, sector) =>
              dispatch({ type: 'PLACE_CARD', playerId: 'A', cardInstanceId: cardId, sector })
            }
            placedOffense={turnActionsUsed.placedOffense}
            placedDefense={turnActionsUsed.placedDefense}
          />
          <div className="sidebar-deck-info">
            <span>📦 Talia A: {state.players.A.deck.length}</span>
          </div>
        </aside>

        {/* Center: Game board */}
        <GameBoard
          state={state}
          currentPlayer={currentPlayer}
          onActivate={(pid, cardId) => dispatch({ type: 'ACTIVATE_ABILITY', playerId: pid, cardInstanceId: cardId })}
          canActivate={canActivate}
        />

        {/* Right: Player B hand + log */}
        <aside className="app-sidebar app-sidebar--right">
          <Hand
            cards={state.players.B.hand}
            playerId="B"
            currentPlayer={currentPlayer}
            onPlaceCard={(cardId, sector) =>
              dispatch({ type: 'PLACE_CARD', playerId: 'B', cardInstanceId: cardId, sector })
            }
            placedOffense={turnActionsUsed.placedOffense}
            placedDefense={turnActionsUsed.placedDefense}
          />
          <div className="sidebar-deck-info">
            <span>📦 Talia B: {state.players.B.deck.length}</span>
          </div>
          <GameLog log={log} />
        </aside>
      </main>

      {/* Overlays */}
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
    </div>
  )
}
