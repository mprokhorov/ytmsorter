import { describe, expect, it } from 'vitest'
import { targetOrder } from '../src/domain/order'
import { planTransfers } from '../src/domain/transfer'
import { item } from './helpers'

describe('целевой порядок', () => {
  it('музыка сортируется по названию, недоступные в конце в исходном порядке', () => {
    const items = [item('b'), item('Deleted video', 'music', { available: false }), item('a'), item('Private video', 'music', { available: false })]
    expect(targetOrder('music', items).map(i => i.title)).toEqual(['a', 'b', 'Deleted video', 'Private video'])
  })

  it('треки по исполнителю, альбому, названию', () => {
    const items = [
      item('Z', 'track', { artists: ['B'], album: 'A' }),
      item('Y', 'track', { artists: ['A'], album: 'B' }),
      item('X', 'track', { artists: ['A'], album: 'A' })
    ]
    expect(targetOrder('tracks', items).map(i => i.title)).toEqual(['X', 'Y', 'Z'])
  })

  it('стабильность при равных ключах', () => {
    const a = item('same')
    const b = item('same')
    expect(targetOrder('music', [b, a])).toEqual([b, a])
  })
})

describe('перенос между плейлистами', () => {
  it('вставляет на правильную позицию и удаляет из исходного', () => {
    const tracks = [item('A', 'track', { artists: ['a'] }), item('clip', 'music'), item('C', 'track', { artists: ['c'] })]
    const music = [item('alpha'), item('B', 'track', { artists: ['b'] }), item('delta')]
    const ops = planTransfers({ tracks, music })
    expect(ops.map(o => [o.item.title, o.to, o.insert, o.position])).toEqual([
      ['clip', 'music', true, 2],
      ['B', 'tracks', true, 1]
    ])
  })

  it('если элемент уже есть в целевом плейлисте, только удаляет', () => {
    const t = item('Song', 'track', { artists: ['x'] })
    const copy = { ...t, id: 'other' }
    const ops = planTransfers({ tracks: [copy], music: [item('m'), t] })
    expect(ops).toHaveLength(1)
    expect(ops[0]!.insert).toBe(false)
  })

  it('недоступные не переносятся', () => {
    const ops = planTransfers({ tracks: [item('Deleted video', 'music', { available: false })], music: [] })
    expect(ops).toHaveLength(0)
  })
})
