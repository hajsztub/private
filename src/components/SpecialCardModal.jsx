import React from 'react'
import './SpecialCardModal.css'

const CARD_ICON = {
  referee: '🟨',
  fans:    '📣',
  pitch:   '🌧️',
  var:     '📹',
}

export { SpecialCardModal }
export default function SpecialCardModal({ card, onDismiss }) {
  if (!card) return null
  const icon = CARD_ICON[card.id] || '🃏'

  return (
    <div className="sc-overlay" onClick={onDismiss}>
      <div className="sc-modal" onClick={e => e.stopPropagation()}>

        {/* Floating tilted card */}
        <div className="sc-card-float" aria-hidden="true">
          <div className="sc-card-inner">
            <div className="sc-bolt sc-bolt--1" />
            <div className="sc-bolt sc-bolt--2" />
            <div className="sc-bolt sc-bolt--3" />
            <div className="sc-bolt sc-bolt--4" />
            <span className="sc-card-icon">{icon}</span>
          </div>
        </div>

        <h2 className="sc-title">KARTA SPECJALNA!</h2>
        <div className="sc-name-badge">{card.name}</div>
        <p className="sc-desc">{card.description}</p>
        <button className="sc-btn" onClick={onDismiss}>KONTYNUUJ GRĘ</button>
      </div>
    </div>
  )
}
