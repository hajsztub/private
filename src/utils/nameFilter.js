const BANNED = [
  'fuck','shit','bitch','cunt','dick','cock','pussy','nigger','nigga','faggot','bastard','whore','slut',
  'kurwa','chuj','pizda','jebać','jebac','pierdol','skurwysyn','cwel','pojebany','kutas','szmata','dziwka','spierdalaj',
]
const NAME_PRE  = ['King','Eagle','Flash','Iron','Tiger','Pro','Star','Mega','Top','Turbo']
const NAME_ROOT = ['Striker','Scorer','Kicker','Chaser','Blaster','Wizard','Keeper','Player']
const NAME_NUM  = ['7','9','10','77','99','_FC','Pro','X']

export function hasProfanity(text) {
  const t = text.toLowerCase().replace(/[^a-ząćęłńóśźż]/g, '')
  return BANNED.some(w => t.includes(w))
}

export function genRandomName() {
  const r = () => Math.floor(Math.random() * 1000)
  return NAME_PRE[r() % NAME_PRE.length] + NAME_ROOT[r() % NAME_ROOT.length] + NAME_NUM[r() % NAME_NUM.length]
}
