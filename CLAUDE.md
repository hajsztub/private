# GOAL TCG — Project Documentation

## Overview
Football-themed collectible card game (TCG) built as a React + Vite PWA. Polish language throughout. Players collect cards, build decks, play ranked matches against AI opponents, complete missions, and progress through league tiers.

**Stack**: React 18, Vite, CSS Modules (plain CSS), no TypeScript, no external state management library.  
**Branch**: `claude/football-cards-setup-9LxOp`  
**Persistence**: All state in `localStorage` (key: `football_cards_v2`)

---

## Project Structure

```
src/
├── App.jsx                    # Root: routing context, profile context, splash, name popup
├── main.jsx                   # Entry point
├── router/AppRouter.jsx       # Simple context-based router (no URL)
├── store/
│   ├── usePersistentStore.js  # All player state → localStorage
│   └── useSettingsStore.js    # Sound/music/language prefs → localStorage
├── screens/                   # Full-screen views (9 screens)
├── components/                # Reusable UI (14 components)
├── game/                      # Game logic engines
├── data/                      # Static definitions
└── utils/nameFilter.js        # Profanity filter + random name gen
```

---

## Screens

| Screen | Route key | Purpose |
|--------|-----------|---------|
| `SplashScreen` | `splash` | 2.2s loading animation, then name popup |
| `MainMenuScreen` | `main_menu` | Hub: match buttons, missions, match history, free pack, notifications |
| `MatchScreen` | `match` | Core gameplay: board, hand, turns, abilities, goal animations |
| `PostMatchScreen` | `post_match` | Results: score, coins, rating change, MVP, match log |
| `DeckBuilderScreen` | `deck_builder` | Formation editor: 11 starters + 3 reserves, slot assignments |
| `MarketScreen` | `market` | Pack shop (7 pack types), card shop (3 rotating cards), sell cards |
| `LeagueScreen` | `league` | Ranking: tier progress, simulated live leaderboard, tier change popup |
| `PlayersScreen` | `players` | Collection: grid view, filter/sort, upgrade cards, card details |
| `SettingsScreen` | `settings` | Name, sound toggles, reset profile |

---

## Game Mechanics

### Match Flow
1. **Pre-match squad view** — player sees their lineup (GK already set from Deck Builder)
2. **Deal Hands** — 4 cards per player (mixed position priority)
3. **10 Rounds** — each round:
   - Active player places card in Offense slot (optional)
   - Active player places card in Defense slot (optional)
   - Active player activates one ability on a field card (optional)
   - AI does the same
   - **Round resolution**: calculate ATK vs DEF, resolve goals probabilistically
   - **Mutual goal block**: if both teams score same round → both void
   - Draw replacement cards
   - Special card reveal on rounds 3, 7, 10
4. **End**: highest total goals wins; equal goals = draw

### Goal Probability
```
P(goal) = 0.05 + 0.25 × sigmoid(diff / 15)
```
- Equal stats: ~17% per team per round
- Min 5%, Max 30%
- Max 5 goals per team per match

### Match Types
| Type | Rating impact | Coins (W/D/L) | AI difficulty |
|------|--------------|---------------|---------------|
| League | +25 / +5 / -15 | 190 / 70 / 65 | Balanced |
| Training Amateur | None | 40 / 12 / 5 | Weak (starter cards) |
| Training PRO | None | 150 / 45 / 25 | Elite (best cards) |

### Card Ability Types
- **Passive** (`passive`): Auto-triggers each round (no player action)
- **Active** (`active`): Always works when activated
- **Coin flip** (`active_coin`): Ball = beneficial effect, Glove = detrimental

### Ability Effects (75+ unique)
`self_stat_change`, `opponent_stat_change`, `remove_opponent_card`, `sector_buff`, `self_lock`, `swap_sector`, `opponent_draw_card`, `full_sector_buff`, `per_round_self_stat`, `cancel_opponent_ability`, `absorb_opposite_card`, `global_attack_debuff`, etc.

---

## Card Data

**File**: `src/data/cards.js`  
**Total cards**: 71 playable + 14 starter (non-tradeable)

| Rarity | Count | Max upgrade bonus |
|--------|-------|-------------------|
| Common | 33 | — |
| Rare | 29 | +3 stats at max level |
| Legendary | 9 | +5 stats at max level |
| Starter | 14 | Non-tradeable |

**Card structure** (key fields):
```js
{
  id, name, type, typeLabel,
  attackStat, defenseStat,
  rarity, marketPrice, sellPrice,
  upgradeCost: [lvl1, lvl2, lvl3],
  upgradeStatBonus,
  abilityName, abilityType,
  abilityDescription, noActivationDescription,
  activationEffect, noActivationEffect, passiveEffect,
}
```

**Deck creation helpers**:
- `createDefaultDeck()` — random player deck
- `createBalancedAIDeck()` — league AI
- `createWeakerAIDeck()` — amateur training AI
- `createEliteAIDeck()` — PRO training AI
- `createDeckFromOwned(ownedCards, definitions)` — player's real deck

---

## Profile State (`localStorage['football_cards_v2']`)

```js
{
  name, hasSetupProfile,
  rating,            // starts 1000
  wins, draws, losses,
  coins,             // starts 600
  gems,              // starts 5
  ownedCards: [{ cardId, instanceId, upgradeLevel (0-3), isStarter }],
  activeDeck: [instanceId],              // 11 cards
  deckAssignments: { slotId: instanceId },
  injuries: { instanceId: timestampUntilHealed },
  dailyMissions: { date, missions[] },
  weeklyMissions: { week, missions[] },
  cardShop: { cardIds, refreshedAt },
  matchHistory: [],                      // last 20
  notifications: [],                     // up to 50
  lastTierChange: { from, to, timestamp } | null,
  lastAdWatchedAt, lastFreePackAt,
  hasSeenTutorial, hasClaimedFirstWinReward,
}
```

**Key methods from `useProfile()`**:
```js
addCoins(n), spendCoins(n)
update(prev => newState)             // generic patch
claimPackCard(cardDef)
sellCard(instanceId)
upgradeCard(instanceId)
addMatchResult(result)               // handles rating, missions, tier, history
claimMission(id), claimWeeklyMission(id)
refreshCardShop(), buyShopCard(cardId)
recordAdWatched(), recordFreePackClaimed()
```

---

## League Tiers

| Tier | Icon | Rating |
|------|------|--------|
| Bronze | 🥉 | 0–999 |
| Silver | 🥈 | 1000–1999 |
| Gold | 🥇 | 2000–2999 |
| Platinum | 💠 | 3000–3999 |
| Diamond | 💎 | 4000+ |

---

## Economy

**Packs** (MarketScreen):
| Pack | Coins | Gems | Cards | Notes |
|------|-------|------|-------|-------|
| Random | 450 | 2 | 3 | min. 1 rare |
| Attack/Defense/Midfield | 550 | 3 | 3 | position-specific |
| Goalkeeper | 650 | 3 | 3 | GK focus |
| Mega | 950 | 5 | 5 | 15% legendary chance |
| Premium | — | 12 | 5 | guaranteed legendary |
| Free | — | — | 1 | 12h cooldown |

**Card Shop**: 3 rotating cards, 12h refresh, price = 2× sell value  
**Upgrade costs**: Common 60/120/250 → Rare 100/200/400 → Legendary 140/280/560 coins

---

## Missions

**Daily** (3 random, midnight reset): play/win matches, score goals, clean sheets → 80–320 coins  
**Weekly** (6 random, Monday reset): harder targets → 450–1100 coins + 2–3 gems; last 2 locked until first 4 claimed

---

## Router Usage

```js
const { navigate, goBack, replace, screen, params } = useRouter()
navigate('match', { matchType: 'league', opponentName: 'xLucas99' })
```

---

## Key Conventions

- Fonts: `'Bangers'` (headings/numbers), `'Outfit'` (body)
- Colors: green accent `#00e676`, background `#080b16`
- CSS custom properties on pack cards: `--pk-card-bg`, `--pk-glow`, `--pk-btn`, `--pk-accent`
- All game state mutations go through `update(prev => ...)` — never mutate directly
- Card instances use `instanceId` (unique per copy), card definitions use `id`
- `isStarter: true` cards cannot be sold or traded
- Injuries use timestamp expiry: `injuries[instanceId] = Date.now() + duration`
- `flex-shrink: 0` required on elements inside `overflow-y: auto` flex containers

---

## Development Notes

- Dev panel in changelog modal, password: `max`
- Dev actions: add gold, add all players, complete daily/weekly missions, add 10 gems, advance league tier
- No TypeScript — prop validation via runtime checks only
- No test suite — manual testing only
- CSS animations: 3D card flip uses `transform-style: preserve-3d` + `backface-visibility: hidden`
- Sound engine is a singleton (`SFX` object), music engine is `Music` singleton
