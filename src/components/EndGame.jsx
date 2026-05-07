import React from 'react'
import './EndGame.css'

export default function EndGame({ state, onRestart }) {
  const { winner, scores } = state

  const isDraw = winner === 'draw'

  return (
    <div className="endgame">
      <div className="endgame-content">
        <div className="endgame-trophy">{isDraw ? '🤝' : '🏆'}</div>
        <h1 className="endgame-title">
          {isDraw ? 'REMIS!' : `GRACZ ${winner} WYGRYWA!`}
        </h1>

        <div className="endgame-scores">
          {['A', 'B'].map((pid) => (
            <div key={pid} className="endgame-player-score">
              <div className="endgame-player-label">Gracz {pid}</div>
              <div className="endgame-stat-row">
                <div className="endgame-stat endgame-stat--attack">
                  <span className="endgame-stat-label">ATAK</span>
                  <span className="endgame-stat-value">{scores[pid].attack}</span>
                </div>
                <div className="endgame-stat endgame-stat--defense">
                  <span className="endgame-stat-label">OBRONA</span>
                  <span className="endgame-stat-value">{scores[pid].defense}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="endgame-verdict">
          {isDraw ? (
            <p>Wyniki są równe! Przeprowadź ostatni rzut żetonem aby wyłonić zwycięzcę.</p>
          ) : (
            <p>
              Gracz {winner} zdobył{' '}
              <strong>{scores[winner].attack}</strong> pkt ataku,
              pokonując obronę przeciwnika{' '}
              (<strong>{scores[winner === 'A' ? 'B' : 'A'].defense}</strong> pkt).
            </p>
          )}
        </div>

        <button className="endgame-restart-btn" onClick={onRestart}>
          🔄 Nowa Gra
        </button>
      </div>
    </div>
  )
}
