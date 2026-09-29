export function pyLower(s: string): string {
  return s.toLowerCase()
}

export function comparePy(a: string, b: string): number {
  if (a === b) return 0
  const n = Math.min(a.length, b.length)
  let i = 0
  while (i < n) {
    const ca = a.codePointAt(i)!
    const cb = b.codePointAt(i)!
    if (ca !== cb) return ca < cb ? -1 : 1
    i += ca > 0xffff ? 2 : 1
  }
  return a.length === b.length ? 0 : a.length < b.length ? -1 : 1
}

const UPPER = /^\p{Uppercase}$/u

export function lastChar(s: string): string {
  if (s.length === 0) return ''
  const low = s.charCodeAt(s.length - 1)
  if (s.length >= 2 && low >= 0xdc00 && low <= 0xdfff) {
    const high = s.charCodeAt(s.length - 2)
    if (high >= 0xd800 && high <= 0xdbff) return s.slice(-2)
  }
  return s.slice(-1)
}

export function pyIsUpperChar(c: string): boolean {
  return UPPER.test(c)
}

export function notUpperFlag(s: string): 'False' | 'True' {
  return pyIsUpperChar(lastChar(s)) ? 'False' : 'True'
}
