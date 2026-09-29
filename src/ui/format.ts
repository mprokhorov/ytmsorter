export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

export function num(n: number): string {
  return n.toLocaleString('ru-RU')
}

export function count(n: number, forms: [string, string, string]): string {
  return `${num(n)} ${plural(n, forms)}`
}

export function timeAgo(ts: number | null, now = Date.now()): string {
  if (!ts) return 'не загружено'
  const s = Math.round((now - ts) / 1000)
  if (s < 45) return 'только что'
  const m = Math.round(s / 60)
  if (m < 60) return `${count(m, ['минуту', 'минуты', 'минут'])} назад`
  const h = Math.round(m / 60)
  if (h < 24) return `${count(h, ['час', 'часа', 'часов'])} назад`
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function duration(ms: number): string {
  const total = Math.max(1, Math.round(ms / 60000))
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`
}

export const ITEMS: [string, string, string] = ['элемент', 'элемента', 'элементов']
export const TRACKS: [string, string, string] = ['трек', 'трека', 'треков']
export const VIDEOS: [string, string, string] = ['видео', 'видео', 'видео']
export const MOVES: [string, string, string] = ['ход', 'хода', 'ходов']
export const UNITS: [string, string, string] = ['единица', 'единицы', 'единиц']
