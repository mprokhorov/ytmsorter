import type { Thumbnail, Thumbnails } from './types'

const ORDER = ['maxres', 'standard', 'high', 'medium', 'default'] as const

type Name = (typeof ORDER)[number]

const SIZES: Record<Name, [number, number]> = {
  maxres: [1280, 720],
  standard: [640, 480],
  high: [480, 360],
  medium: [320, 180],
  default: [120, 90]
}

export interface CoverSource {
  url: string
  width: number
  aspect: number
}

function size(name: Name, t: Thumbnail): [number, number] {
  return t.width && t.height ? [t.width, t.height] : SIZES[name]
}

export function isWide(aspect: number): boolean {
  return aspect > 1.6
}

export function coverSources(thumbs: Thumbnails, minWidth: number): CoverSource[] {
  const all = ORDER.flatMap(name => {
    const t = thumbs[name]
    if (!t?.url) return []
    const [w, h] = size(name, t)
    return [{ url: t.url, width: w, aspect: w / h }]
  })
  const rank = (s: CoverSource) => (isWide(s.aspect) ? 0 : 2) + (s.width >= minWidth ? 0 : 1)
  return all
    .map((s, i) => ({ s, i }))
    .sort((a, b) => rank(a.s) - rank(b.s) || (a.s.width >= minWidth && b.s.width >= minWidth ? a.s.width - b.s.width : b.s.width - a.s.width) || a.i - b.i)
    .map(x => x.s)
}

export function squareScale(aspect: number): number {
  return isWide(aspect) ? 1 : 4 / 3
}

export function guessedThumbs(videoId: string): Thumbnails {
  const base = `https://i.ytimg.com/vi/${videoId}/`
  return {
    medium: { url: base + 'mqdefault.jpg', width: 320, height: 180 },
    high: { url: base + 'hqdefault.jpg', width: 480, height: 360 }
  }
}
