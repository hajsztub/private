import React, { useState } from 'react'
import PlayerCard from './PlayerCard'
import './Hand.css'

export default function Hand({
  cards,
  playerId,
  currentPlayer,
  onPlaceCard,
  placedOffense,
  placedDefense,
}) {
  const [selectedCard, setSelectedCard] = useState(null)
  const [targetSector, setTargetSector] = useState(null)

  const isMyTurn = currentPlayer === playerId

  const handleCardClick = (card) => {
    if (!isMyTurn) return
    setSelectedCard(selectedCard?.instanceId === card.instanceId ? null : card)
    setTargetSector(null)
  }

  const handlePlace = (sector) => {
    if (!selectedCard) return
    onPlaceCard(selectedCard.instanceId, sector)
    setSelectedCard(null)
    setTargetSector(null)
  }

  return (
    <div className={`hand ${isMyTurn ? 'hand--active' : 'hand--inactive'}`}>
      <div className="hand__label">
        {isMyTurn ? `Gracz ${playerId} – Twoja tura` : `Gracz ${playerId}`}
        {isMyTurn && <span className="hand__turn-badge">TWOJA KOLEJ</span>}
      </div>

      <div className="hand__cards">
        {cards.map((card) => (
          <PlayerCard
            key={card.instanceId}
            card={card}
            compact
            onClick={isMyTurn ? () => handleCardClick(card) : undefined}
            selected={selectedCard?.instanceId === card.instanceId}
          />
        ))}
        {cards.length === 0 && (
          <div className="hand__empty">Brak kart w ręce</div>
        )}
      </div>

      {isMyTurn && selectedCard && (
        <div className="hand__place-options">
          <span className="hand__place-label">Umieść {selectedCard.name} w:</span>
          <div className="hand__place-buttons">
            {(selectedCard.type === 'attack' || selectedCard.type === 'midfield') && !placedOffense && (
              <button className="place-btn place-btn--offense" onClick={() => handlePlace('offense')}>
                ▶ Ofensywa
              </button>
            )}
            {(selectedCard.type === 'defense' || selectedCard.type === 'midfield') && !placedDefense && (
              <button className="place-btn place-btn--defense" onClick={() => handlePlace('defense')}>
                ◈ Defensywa
              </button>
            )}
            <button className="place-btn place-btn--cancel" onClick={() => setSelectedCard(null)}>
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
