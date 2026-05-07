import React, { useEffect, useState } from 'react'
import './GoalAnimation.css'

export default function GoalAnimation({ scorer, score, onDone }) {
  const [phase, setPhase] = useState('ball') // ball | celebrate | done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('celebrate'), 1000)
    const t2 = setTimeout(() => { setPhase('done'); onDone?.() }, 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'done') return null

  const isPlayer = scorer === 'player'

  return (
    <div className={`goal-anim-overlay goal-anim-overlay--${isPlayer ? 'player' : 'ai'}`}>
      {/* Ball arc */}
      <div className={`goal-ball goal-ball--${isPlayer ? 'up' : 'down'} ${phase === 'celebrate' ? 'goal-ball--hidden' : ''}`}>
        ⚽
      </div>

      {/* Net shake */}
      <div className={`goal-net goal-net--${isPlayer ? 'top' : 'bottom'} ${phase === 'celebrate' ? 'goal-net--shake' : ''}`}>
        <svg viewBox="0 0 120 50" className="goal-net-svg">
          {/* Posts */}
          <rect x="5" y="5" width="4" height="45" fill="white" rx="2" />
          <rect x="111" y="5" width="4" height="45" fill="white" rx="2" />
          <rect x="5" y="5" width="110" height="4" fill="white" rx="2" />
          {/* Net lines */}
          {[0,1,2,3,4,5,6].map(i => (
            <line key={`v${i}`} x1={9 + i*16} y1="9" x2={9 + i*16} y2="50" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
          ))}
          {[0,1,2,3,4].map(i => (
            <line key={`h${i}`} x1="9" y1={9 + i*10} x2="111" y2={9 + i*10} stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
          ))}
        </svg>
      </div>

      {/* Score popup */}
      {phase === 'celebrate' && (
        <div className="goal-celebrate">
          <div className="goal-celebrate-text">GOL!</div>
          <div className="goal-score">{score.player} : {score.ai}</div>
          <div className="goal-team">{isPlayer ? '⚽ Twój gol!' : '😤 Gol przeciwnika'}</div>
        </div>
      )}
    </div>
  )
}
