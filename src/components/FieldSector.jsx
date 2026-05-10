import React from 'react'
import PlayerCard from './PlayerCard'
import './FieldSector.css'

export default function FieldSector({
  label,
  cards,
  sectorType,
  playerId,
  currentPlayer,
  onCardClick,
  onActivate,
  canActivate,
  isCurrentPlayerSector,
  showScore,
  score,
}) {
  const isOffense = sectorType === 'offense'
  const emptySlots = Math.max(0, 3 - cards.length)

  return (
    <div className={`field-sector field-sector--${isOffense ? 'offense' : 'defense'}`}>
      <div className="field-sector__label">
        <span>{label}</span>
        {showScore && <span className="field-sector__score">{score} PKT</span>}
      </div>

      <div className="field-sector__cards">
        {cards.map((card) => (
          <PlayerCard
            key={card.instanceId}
            card={card}
            compact
            showBack={card.faceDown}
            onClick={isCurrentPlayerSector && !card.faceDown ? () => onCardClick?.(card) : undefined}
            onActivate={onActivate}
            canActivate={canActivate}
            isCurrentPlayer={currentPlayer === playerId}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className="field-sector__empty-slot" />
        ))}
      </div>
    </div>
  )
}
