import React, { useState, useEffect } from 'react'
import './CoinFlip.css'

export default function CoinFlip({ coinFlipState, onFlip, onDismiss }) {
  const [animating, setAnimating] = useState(false)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (coinFlipState?.result && !showResult) {
      setAnimating(true)
      const t = setTimeout(() => {
        setAnimating(false)
        setShowResult(true)
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [coinFlipState?.result])

  useEffect(() => {
    setShowResult(false)
    setAnimating(false)
  }, [coinFlipState?.cardInstanceId])

  if (!coinFlipState) return null

  const { result, pending } = coinFlipState
  const isBall = result === 'ball'

  return (
    <div className="coin-flip-overlay">
      <div className="coin-flip-modal">
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
            {isBall ? '⚽ PIŁKA!' : '🧤 RĘKAWICA!'}
          </div>
        )}

        <div className="coin-flip-actions">
          {pending && !result && (
            <button className="coin-btn coin-btn--flip" onClick={onFlip}>
              Rzuć Żetonem!
            </button>
          )}
          {showResult && (
            <button className="coin-btn coin-btn--ok" onClick={onDismiss}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
