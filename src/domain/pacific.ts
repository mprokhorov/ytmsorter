const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' })

export function pacificDay(date: Date = new Date()): string {
  return formatter.format(date)
}

export function msUntilPacificMidnight(now: Date = new Date()): number {
  const day = pacificDay(now)
  let lo = now.getTime()
  let hi = lo + 26 * 3600_000
  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2)
    if (pacificDay(new Date(mid)) === day) lo = mid
    else hi = mid
  }
  return hi - now.getTime()
}
