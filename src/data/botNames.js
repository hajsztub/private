const FIRST = [
  'Kamil','Piotr','Maciej','Tomek','Kuba','Bartek','Marek','Łukasz',
  'Filip','Michał','Paweł','Damian','Rafał','Karol','Mateusz','Wojtek',
  'Szymon','Adrian','Patryk','Krzysztof','Mariusz','Dariusz','Robert',
  'Sebastian','Przemek','Grzegorz','Artur','Jakub','Adam','Marek',
  'Enrique','Lorenzo','Diego','Marco','Ivan','Rafael','Carlos','Victor',
  'Thiago','Lucas','Samuel','Oscar','Felix','Rodrigo','Alejandro',
]

const SUFFIX = [
  'PL','99','FC','Pro','King','Boss','Star','Fox','Wolf','Max',
  'XT','G','X','88','77','XD','GG','HD','2K','ACE',
  '_PL','_EU','_GOL','_FC','_DEF','_ATK',
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function getBotName(seed = Date.now()) {
  const s = typeof seed === 'string' ? hash(seed) : seed
  const first = FIRST[s % FIRST.length]
  const suf = SUFFIX[Math.floor(s / FIRST.length) % SUFFIX.length]
  return `${first}${suf}`
}

// Generate a deterministic leaderboard of n fake players around a given rating
export function generateLeaderboard(playerRating, playerName = 'Gracz', count = 20) {
  const rows = []
  const spread = 400
  for (let i = 0; i < count; i++) {
    const h = hash(`leaderboard_${i}_${Math.floor(playerRating / 100)}`)
    const offset = (h % (spread * 2)) - spread
    const rating = Math.max(0, playerRating + offset)
    rows.push({
      id: `bot_${i}`,
      name: getBotName(h),
      rating,
      wins: Math.floor(rating / 22),
      isBot: true,
    })
  }
  rows.push({ id: 'player', name: playerName, rating: playerRating, isPlayer: true })
  rows.sort((a, b) => b.rating - a.rating)
  return rows
}

export const LEAGUE_TIERS = [
  { id: 'bronze',   label: 'Brązowa',    icon: '🥉', min: 0,    max: 999,  color: '#cd7f32' },
  { id: 'silver',   label: 'Srebrna',    icon: '🥈', min: 1000, max: 1999, color: '#9e9e9e' },
  { id: 'gold',     label: 'Złota',      icon: '🥇', min: 2000, max: 2999, color: '#ffd700' },
  { id: 'platinum', label: 'Platynowa',  icon: '💠', min: 3000, max: 3999, color: '#4fc3f7' },
  { id: 'diamond',  label: 'Diamentowa', icon: '💎', min: 4000, max: Infinity, color: '#ce93d8' },
]

export function getTier(rating) {
  return LEAGUE_TIERS.find(t => rating >= t.min && rating <= t.max) || LEAGUE_TIERS[0]
}
