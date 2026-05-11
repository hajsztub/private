import React from 'react'
import { useProfile } from '../App'
import './CurrencyBar.css'

export default function CurrencyBar({ onGemsClick }) {
  const { profile } = useProfile()
  const gems = profile.gems ?? 0

  return (
    <div className="cb-bar">
      <div className="cb-item cb-item--coins">
        <span className="cb-icon">M</span>
        <span className="cb-val">{profile.coins.toLocaleString()}</span>
      </div>
      <div className="cb-divider" />
      <div className="cb-item cb-item--gems" onClick={onGemsClick}>
        <span className="cb-icon">💎</span>
        <span className="cb-val">{gems}</span>
        {onGemsClick && <span className="cb-plus">+</span>}
      </div>
    </div>
  )
}
