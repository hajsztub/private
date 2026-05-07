import React from 'react'
import GoalkeeperSlot from './GoalkeeperSlot'
import FieldSector from './FieldSector'
import StatsCounter from './StatsCounter'
import { calculateScores } from '../game/gameEngine'
import './GameBoard.css'

export default function GameBoard({ state, currentPlayer, onActivate, canActivate }) {
  const { players } = state
  const scores = calculateScores(state)

  const getOffenseScore = (pid) =>
    players[pid].offenseSector.reduce((s, c) => s + (c.currentAttackStat ?? c.attackStat ?? 0), 0)
  const getDefenseScore = (pid) =>
    players[pid].defenseSector.reduce((s, c) => s + (c.currentDefenseStat ?? c.defenseStat ?? 0), 0) +
    (players[pid].activeGoalkeeper?.currentDefenseStat ?? players[pid].activeGoalkeeper?.defenseStat ?? 0)

  return (
    <div className="game-board">
      {/* ── Player A top row ── */}
      <div className="board-row board-row--player-a">
        <StatsCounter label="OBRONA" value={getDefenseScore('A')} variant="defense" />
        <GoalkeeperSlot goalkeeper={players.A.activeGoalkeeper} playerId="A" />
        <StatsCounter label="ATAK" value={getOffenseScore('A')} variant="attack" />
      </div>

      {/* ── Field ── */}
      <div className="board-field">
        {/* Player A's sectors (top half of field) */}
        <div className="board-field-half board-field-half--a">
          <FieldSector
            label="OFENSYWA"
            cards={players.A.offenseSector}
            sectorType="offense"
            playerId="A"
            currentPlayer={currentPlayer}
            onActivate={(id) => onActivate('A', id)}
            canActivate={canActivate}
            isCurrentPlayerSector={currentPlayer === 'A'}
            showScore
            score={getOffenseScore('A')}
          />
          <FieldSector
            label="DEFENSYWA"
            cards={players.A.defenseSector}
            sectorType="defense"
            playerId="A"
            currentPlayer={currentPlayer}
            onActivate={(id) => onActivate('A', id)}
            canActivate={canActivate}
            isCurrentPlayerSector={currentPlayer === 'A'}
            showScore
            score={getDefenseScore('A') - (players.A.activeGoalkeeper?.currentDefenseStat ?? 0)}
          />
        </div>

        {/* Midfield divider */}
        <div className="board-midfield">
          <div className="midfield-line" />
          <div className="midfield-circle">
            <span>⚽</span>
          </div>
          <div className="midfield-line" />
        </div>

        {/* Player B's sectors (bottom half of field) */}
        <div className="board-field-half board-field-half--b">
          <FieldSector
            label="DEFENSYWA"
            cards={players.B.defenseSector}
            sectorType="defense"
            playerId="B"
            currentPlayer={currentPlayer}
            onActivate={(id) => onActivate('B', id)}
            canActivate={canActivate}
            isCurrentPlayerSector={currentPlayer === 'B'}
            showScore
            score={getDefenseScore('B') - (players.B.activeGoalkeeper?.currentDefenseStat ?? 0)}
          />
          <FieldSector
            label="OFENSYWA"
            cards={players.B.offenseSector}
            sectorType="offense"
            playerId="B"
            currentPlayer={currentPlayer}
            onActivate={(id) => onActivate('B', id)}
            canActivate={canActivate}
            isCurrentPlayerSector={currentPlayer === 'B'}
            showScore
            score={getOffenseScore('B')}
          />
        </div>
      </div>

      {/* ── Player B bottom row ── */}
      <div className="board-row board-row--player-b">
        <StatsCounter label="ATAK" value={getOffenseScore('B')} variant="attack" />
        <GoalkeeperSlot goalkeeper={players.B.activeGoalkeeper} playerId="B" />
        <StatsCounter label="OBRONA" value={getDefenseScore('B')} variant="defense" />
      </div>
    </div>
  )
}
