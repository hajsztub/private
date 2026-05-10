import React from 'react'
import './GameLog.css'

export default function GameLog({ log }) {
  return (
    <div className="game-log">
      <div className="game-log__title">Dziennik Gry</div>
      <div className="game-log__entries">
        {log.map((entry, i) => (
          <div key={i} className={`log-entry log-entry--${entry.type}`}>
            {entry.round > 0 && <span className="log-entry__round">R{entry.round}</span>}
            <span className="log-entry__msg">{entry.message}</span>
          </div>
        ))}
        {log.length === 0 && <div className="log-empty">Brak wpisów</div>}
      </div>
    </div>
  )
}
