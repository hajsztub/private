import React, { useState, useEffect } from 'react'
import './CoinFlip.css'

export default function CoinFlip({ coinFlipState, card, onFlip, onDismiss }) {
  const [animating, setAnimating] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const isPlayer = coinFlipState?.player === 'A'

  useEffect(() => {
    if (coinFlipState?.result && !showResult) {
      setAnimating(true)
      const t = setTimeout(() => { setAnimating(false); setShowResult(true) }, 1400)
      return () => clearTimeout(t)
    }
  }, [coinFlipState?.result])

  useEffect(() => { setShowResult(false); setAnimating(false) }, [coinFlipState?.cardInstanceId])

  if (!coinFlipState) return null

  const { result, pending } = coinFlipState
  const isBall  = result === 'ball'
  const ballMsg  = card?.activationEffect?.ball?.message
  const gloveMsg = card?.activationEffect?.glove?.message
  const resultMsg = result ? (isBall ? ballMsg : gloveMsg) : null

  return (
    <div className="cf-overlay">
      <div className={`cf-panel ${isPlayer ? 'cf-panel--player' : 'cf-panel--opponent'}`}>

        {/* Stadium floor decoration */}
        <div className="cf-stadium-bg" />

        {/* Owner badge */}
        <div className={`cf-owner-badge ${isPlayer ? 'cf-owner-badge--player' : 'cf-owner-badge--opponent'}`}>
          {isPlayer ? '🎯 TWÓJ RZUT' : '⚡ RZUT PRZECIWNIKA'}
        </div>

        {/* Ability name */}
        {card?.abilityName && (
          <div className="cf-ability-name">
            ⚡ {card.abilityName.toUpperCase()}
          </div>
        )}

        {/* Title */}
        <div className="cf-title">RZUT ŻETONEM</div>

        {/* Outcome preview (before flip) */}
        {!result && (
          <div className="cf-outcomes">
            <div className="cf-outcome cf-outcome--ball">
              <span className="cf-outcome-ico">⚽</span>
              <div className="cf-outcome-body">
                <span className="cf-outcome-label">Piłka</span>
                {ballMsg && <span className="cf-outcome-desc">{ballMsg}</span>}
              </div>
            </div>
            <div className="cf-outcome cf-outcome--glove">
              <span className="cf-outcome-ico">🧤</span>
              <div className="cf-outcome-body">
                <span className="cf-outcome-label">Rękawica</span>
                {gloveMsg && <span className="cf-outcome-desc">{gloveMsg}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Coin */}
        <div className={[
          'cf-coin-wrap',
          animating ? 'cf-coin-wrap--spin' : '',
          showResult ? (isBall ? 'cf-coin-wrap--ball' : 'cf-coin-wrap--glove') : '',
          !result ? 'cf-coin-wrap--idle' : '',
        ].filter(Boolean).join(' ')}>
          <div className="cf-coin-ring" />
          <div className="cf-coin">
            {!result || animating
              ? <span className="cf-coin-q">{animating ? '' : '?'}</span>
              : <span className="cf-coin-emoji">{isBall ? '⚽' : '🧤'}</span>
            }
          </div>
        </div>

        {/* Result banner */}
        {showResult && (
          <div className={`cf-result-banner ${isBall ? 'cf-result-banner--ball' : 'cf-result-banner--glove'}`}>
            {isBall ? '⚽' : '🧤'} {isBall ? 'PIŁKA!' : 'RĘKAWICA!'}{resultMsg ? ` ${resultMsg.toUpperCase()}` : ''}
          </div>
        )}

        {/* Confirmation text */}
        {showResult && resultMsg && (
          <div className="cf-confirm">
            <span className="cf-confirm-check">✓</span>
            <span className="cf-confirm-msg">{resultMsg} zostało aktywowane!</span>
          </div>
        )}

        {/* Actions */}
        <div className="cf-actions">
          {isPlayer && pending && !result && (
            <button className="cf-btn cf-btn--flip" onClick={onFlip}>
              Rzuć żetonem!
            </button>
          )}
          {!isPlayer && pending && !result && (
            <div className="cf-waiting">Przeciwnik rzuca<span className="cf-dots">...</span></div>
          )}
          {showResult && isPlayer && (
            <button className="cf-btn cf-btn--ok" onClick={onDismiss}>OK</button>
          )}
          {showResult && !isPlayer && (
            <div className="cf-waiting cf-waiting--done">Zamykanie...</div>
          )}
        </div>
      </div>
    </div>
  )
}
