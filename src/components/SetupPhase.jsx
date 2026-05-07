import React from 'react'
import PlayerCard from './PlayerCard'
import './SetupPhase.css'

export default function SetupPhase({ state, onSelectGoalkeeper }) {
  const { setupStep, players } = state

  const pickingPlayer = setupStep === 'A_picks_goalkeeper' ? 'A' : 'B'
  const player = players[pickingPlayer]
  const alreadyPicked = pickingPlayer === 'B' && players.A.activeGoalkeeper

  return (
    <div className="setup-phase">
      <div className="setup-banner">
        <div className="setup-ball">⚽</div>
        <h1 className="setup-title">Football Cards</h1>
        <p className="setup-subtitle">Wybierz swojego bramkarza</p>
      </div>

      {alreadyPicked && (
        <div className="setup-done-row">
          <span className="setup-done-label">Gracz A wybrał:</span>
          <PlayerCard card={players.A.activeGoalkeeper} compact />
        </div>
      )}

      <div className="setup-pick-area">
        <h2 className="setup-pick-title">Gracz {pickingPlayer} – wybierz bramkarza</h2>
        <p className="setup-pick-hint">Drugi bramkarz trafi do rezerwy.</p>

        <div className="setup-goalkeeper-options">
          {player.goalkeepers.map((gk) => (
            <div key={gk.instanceId} className="setup-gk-wrapper">
              <PlayerCard
                card={gk}
                onClick={() => onSelectGoalkeeper(pickingPlayer, gk.instanceId)}
              />
              <button
                className="setup-select-btn"
                onClick={() => onSelectGoalkeeper(pickingPlayer, gk.instanceId)}
              >
                Wybierz {gk.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
