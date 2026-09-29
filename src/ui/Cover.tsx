import { useEffect, useMemo, useState } from 'preact/hooks'
import { coverSources, squareScale } from '../domain/thumbs'
import type { Kind, Thumbnails } from '../domain/types'
import { Icon } from './icons'

export type Shape = 'square' | 'wide'

interface Props {
  thumbs: Thumbnails
  shape: Shape
  size: number
  kind?: Kind
  eager?: boolean
}

export function Cover({ thumbs, shape, size, kind = 'track', eager }: Props) {
  const minWidth = shape === 'square' ? Math.ceil(size * 2 * (16 / 9)) : size * 2
  const sources = useMemo(() => coverSources(thumbs, minWidth), [thumbs, minWidth])
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [sources])
  const source = sources[index]
  const style = shape === 'square' ? { width: size, height: size } : { width: size, height: Math.round((size * 9) / 16) }
  return (
    <div class={`cover cover--${shape}`} style={style}>
      {source ? (
        <img
          src={source.url}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={shape === 'square' ? { transform: `scale(${squareScale(source.aspect)})` } : undefined}
          onError={() => setIndex(i => i + 1)}
        />
      ) : (
        <span class="cover__placeholder">
          <Icon name={kind === 'track' ? 'note' : 'video'} size={Math.round(size * 0.45)} />
        </span>
      )}
    </div>
  )
}
