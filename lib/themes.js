// Temele de sărbătoare pentru cardurile de lecții. Stilurile sunt în globals.css ([data-theme="..."]).
// Ca să adaugi o temă nouă: o treci aici și îi faci un bloc [data-theme="id"] în globals.css.
export const THEMES = [
  { id: '', label: 'Fără temă', emoji: '🎨' },
  { id: 'halloween', label: 'Halloween', emoji: '🎃' },
  { id: 'craciun', label: 'Crăciun', emoji: '🎄' },
  { id: 'martisor', label: 'Mărțișor', emoji: '🌸' },
  { id: 'paste', label: 'Paște', emoji: '🐣' },
  { id: 'copilului', label: 'Ziua copilului', emoji: '🎈' },
]
export const THEME_IDS = THEMES.map((t) => t.id).filter(Boolean)
