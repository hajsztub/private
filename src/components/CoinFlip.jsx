import React, { useState, useEffect } from 'react'
import './CoinFlip.css'

export default function CoinFlip({ coinFlipState, card, onFlip, onDismiss }) {
  const [animating, setAnimating] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const isPlayer = coinFlipState?.player === 'A'

  useEffect(() => {
    if (coinFlipState?.result && !showResult) {
      setAnimating(true)
      const t = setTimeout(() => { setAnimating(false); setShowResult(true) }, 1200)
      return () => clearTimeout(t)
    }
  }, [coinFlipState?.result])

  useEffect(() => { setShowResult(false); setAnimating(false) }, [coinFlipState?.cardInstanceId])

  if (!coinFlipState) return null

  const { result, pending } = coinFlipState
  const isBall = result === 'ball'
  const ballMsg = card?.activationEffect?.ball?.message
  const gloveMsg = card?.activationEffect?.glove?.message

  return (
    <div className="coin-flip-overlay">
      <div className={`coin-flip-modal ${isPlayer ? 'coin-flip-modal--player' : 'coin-flip-modal--opponent'}`}>
        <div className={`coin-flip-owner ${isPlayer ? 'coin-flip-owner--player' : 'coin-flip-owner--opponent'}`}>
          {isPlayer ? '🎯 TWÓJ RZUT' : '⚡ RZUT PRZECIWNIKA'}
        </div>

        {card && <div className="coin-card-name">⚡ {card.abilityName}</div>}

        {/* Show outcomes before flip */}
        {!result && (
          <div className="coin-outcomes">
            <div className="coin-outcome coin-outcome--ball">
              <span className="co-icon">⚽</span>
              <div className="co-text">
                <span className="co-label">Piłka</span>
                {ballMsg && <span className="co-desc">{ballMsg}</span>}
              </div>
            </div>
            <div className="coin-outcome coin-outcome--glove">
              <span className="co-icon">🧤</span>
              <div className="co-text">
                <span className="co-label">Rękawica</span>
                {gloveMsg && <span className="co-desc">{gloveMsg}</span>}
              </div>
            </div>
          </div>
        )}

        <h2 className="coin-flip-title">Rzut Żetonem</h2>

        <div className={`coin ${animating ? 'coin--spinning' : ''} ${showResult ? (isBall ? 'coin--ball' : 'coin--glove') : ''}`}>
          {!result ? (
            <div className="coin-face coin-face--question">?</div>
          ) : showResult ? (
            <div className={`coin-face ${isBall ? 'coin-face--ball' : 'coin-face--glove'}`}>
              {isBall ? '⚽' : '🧤'}
            </div>
          ) : (
            <div className="coin-face coin-face--question">...</div>
          )}
        </div>

        {showResult && (
          <div className={`coin-result ${isBall ? 'coin-result--ball' : 'coin-result--glove'}`}>
            {isBall ? `⚽ PIŁKA! ${ballMsg || ''}` : `🧤 RĘKAWICA! ${gloveMsg || ''}`}
          </div>
        )}

        <div className="coin-flip-actions">
          {/* Only player can press the flip button */}
          {isPlayer && pending && !result && (
            <button className="coin-btn coin-btn--flip" onClick={onFlip}>Rzuć Żetonem!</button>
          )}
          {!isPlayer && pending && !result && (
            <div className="coin-waiting">Przeciwnik rzuca...</div>
          )}
          {showResult && isPlayer && (
            <button className="coin-btn coin-btn--ok" onClick={onDismiss}>OK</button>
          )}
          {showResult && !isPlayer && (
            <div className="coin-waiting coin-waiting--done">Zamykanie...</div>
          )}
        </div>
      </div>
    </div>
  )
}
