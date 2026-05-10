const TRAINING_BOT_NAMES = [
  'AUTOBOT-9', 'ROBO-KEEPER', 'BOT-3000', 'CYBER-FC', 'MECH-STRIKER',
  'DROID-DEF', 'ALGO-PRO', 'MATRIX-XI', 'NEURAL-FC', 'PIXEL-TEAM',
  'CIRCUIT-GK', 'DATABOT-77', 'TURBO-AI', 'GLITCH-FC', 'SYSTEM-ERR',
]

const NICK_BASE = [
  'Kamil','Piotr','Kuba','Bartek','Łukasz','Filip','Michał','Rafał',
  'Mateusz','Wojtek','Adrian','Patryk','Sebastian','Przemek','Artur',
  'Enrique','Lorenzo','Diego','Marco','Ivan','Rafael','Carlos','Victor',
  'Thiago','Lucas','Samuel','Oscar','Felix','Rodrigo','Alejandro',
  'striker','keeper','eagle','wolf','dragon','falcon','lion','hawk',
  'shadow','storm','blaze','apex','ghost','titan','raven','viper',
]

const NICK_PREFIX = ['x','X','el','pro','king','top','big','dr','mr','dj','real']
const NICK_SUFFIX = ['99','77','88','07','PL','EU','FC','GG','XD','Pro','ACE','HD','2K','gg','tv']

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function getBotName(seed = Date.now(), type = 'league') {
  if (type === 'training') {
    const s = typeof seed === 'string' ? hash(seed) : seed
    return TRAINING_BOT_NAMES[s % TRAINING_BOT_NAMES.length]
  }
  const s = typeof seed === 'string' ? hash(seed) : seed
  const base = NICK_BASE[s % NICK_BASE.length]
  const pattern = s % 5
  if (pattern === 0) return NICK_PREFIX[(s >> 3) % NICK_PREFIX.length] + base + NICK_SUFFIX[(s >> 6) % NICK_SUFFIX.length]
  if (pattern === 1) return base + NICK_SUFFIX[(s >> 4) % NICK_SUFFIX.length]
  if (pattern === 2) return NICK_PREFIX[(s >> 5) % NICK_PREFIX.length] + base.charAt(0).toUpperCase() + base.slice(1)
  if (pattern === 3) return base + '_' + NICK_SUFFIX[(s >> 7) % NICK_SUFFIX.length]
  return base + (100 + (s % 900))
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
