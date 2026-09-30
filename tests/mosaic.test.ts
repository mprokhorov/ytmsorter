import { describe, expect, it } from 'vitest'
import { mosaicItems } from '../src/domain/mosaic'
import { item } from './helpers'

describe('обложка плейлиста', () => {
  it('треки: первые четыре разных альбома, а не четыре первых трека', () => {
    const items = [
      item('A1', 'track', { artists: ['ABBA'], album: 'Gold' }),
      item('A2', 'track', { artists: ['ABBA'], album: 'Gold' }),
      item('A3', 'track', { artists: ['ABBA'], album: 'gold' }),
      item('B1', 'track', { artists: ['Adele'], album: '21' }),
      item('B2', 'track', { artists: ['Adele'], album: '21' }),
      item('C1', 'track', { artists: ['Adele'], album: '25' }),
      item('D1', 'track', { artists: ['Björk'], album: 'Post' }),
      item('E1', 'track', { artists: ['Queen'], album: 'Jazz' })
    ]
    expect(mosaicItems('tracks', items).map(i => i.title)).toEqual(['A1', 'B1', 'C1', 'D1'])
  })

  it('сборник с разными исполнителями считается одним альбомом', () => {
    const items = [item('X', 'track', { artists: ['A'], album: 'Now 45' }), item('Y', 'track', { artists: ['B'], album: 'Now 45' }), item('Z', 'track', { artists: ['C'], album: 'Other' })]
    expect(mosaicItems('tracks', items).map(i => i.title)).toEqual(['X', 'Z'])
  })

  it('трек без распознанного альбома не склеивается с другими', () => {
    const items = [item('X', 'track', { artists: ['A'], album: '' }), item('Y', 'track', { artists: ['A'], album: '' })]
    expect(mosaicItems('tracks', items)).toHaveLength(2)
  })

  it('пропускает недоступные и элементы не своего типа', () => {
    const items = [
      item('clip', 'music'),
      item('gone', 'track', { album: 'G', available: false }),
      item('ok', 'track', { album: 'K' })
    ]
    expect(mosaicItems('tracks', items).map(i => i.title)).toEqual(['ok'])
    expect(mosaicItems('music', items).map(i => i.title)).toEqual(['clip'])
  })

  it('музыка: одно и то же видео дважды — одна обложка', () => {
    const a = item('same')
    const copy = { ...a, id: 'other' }
    expect(mosaicItems('music', [a, copy, item('b')]).map(i => i.title)).toEqual(['same', 'b'])
  })
})
