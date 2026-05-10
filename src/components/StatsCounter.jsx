import React from 'react'
import './StatsCounter.css'

export default function StatsCounter({ label, value, variant }) {
  return (
    <div className={`stats-counter stats-counter--${variant}`}>
      <div className="stats-counter__label">{label}:</div>
      <div className="stats-counter__value">{value}</div>
    </div>
  )
}
