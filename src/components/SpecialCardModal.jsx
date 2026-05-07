import React from 'react'
import './SpecialCardModal.css'

export { SpecialCardModal }
export default function SpecialCardModal({ card, onDismiss }) {
  if (!card) return null

  return (
    <div className="special-modal-overlay">
      <div className="special-modal">
        <div className="special-modal__icon">🃏</div>
        <h2 className="special-modal__title">Karta Specjalna!</h2>
        <div className="special-modal__card-name">{card.name}</div>
        <p className="special-modal__desc">{card.description}</p>
        <button className="special-modal__btn" onClick={onDismiss}>
          Kontynuuj grę
        </button>
      </div>
    </div>
  )
}
