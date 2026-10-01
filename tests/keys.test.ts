import { describe, expect, it } from 'vitest'
import { compareKeys, musicKey, trackKey } from '../src/domain/keys'
import fixture from './fixtures/sort.json'

interface Row {
  artist: string
  album: string
  title: string
}

function stableSort<T>(xs: readonly T[], cmp: (a: T, b: T) => number): T[] {
  return [...xs].sort(cmp)
}

describe('ключи сортировки', () => {
  it('при равенстве в нижнем регистре раньше та, что оканчивается заглавной', () => {
    const names = ['abc', 'abC', 'ABC', 'Abc']
    const sorted = stableSort(names, (a, b) => compareKeys(musicKey(a), musicKey(b)))
    expect(sorted).toEqual(['abC', 'ABC', 'abc', 'Abc'])
  })

  it('кириллица', () => {
    const names = ['кино', 'КИНО', 'Кино', 'ария', 'Ёлка', 'Яблоко']
    const sorted = stableSort(names, (a, b) => compareKeys(musicKey(a), musicKey(b)))
    expect(sorted).toEqual(['ария', 'КИНО', 'кино', 'Кино', 'Яблоко', 'Ёлка'])
  })

  it('цифры и символы на конце не считаются заглавными', () => {
    expect(compareKeys(musicKey('Song 2'), musicKey('song 2'))).toBe(0)
    expect(compareKeys(musicKey('HELLO!'), musicKey('hello!'))).toBe(0)
    expect(compareKeys(musicKey('HELLO'), musicKey('hello'))).toBe(-1)
  })

  it('равные строки дают 0', () => {
    expect(compareKeys(trackKey(['A'], 'B', 'C'), trackKey(['A'], 'B', 'C'))).toBe(0)
  })

  it('пустые строки не роняют сортировку', () => {
    const rows = [trackKey([''], '', ''), trackKey(['a'], '', 'x'), trackKey([''], 'b', '')]
    const sorted = stableSort(rows, compareKeys)
    expect(sorted[0]).toEqual(trackKey([''], '', ''))
    expect(sorted[2]).toEqual(trackKey(['a'], '', 'x'))
  })

  it('порядок полей: исполнитель, альбом, название', () => {
    const a = trackKey(['Adele'], '25', 'Hello')
    const b = trackKey(['Adele'], '21', 'Rolling in the Deep')
    const c = trackKey(['ABBA'], 'Gold', 'SOS')
    expect(stableSort([a, b, c], compareKeys)).toEqual([c, b, a])
  })
})

describe('несколько исполнителей — как в исходном скрипте', () => {
  const t = (artists: string[], album = 'X', name = 'n') => trackKey(artists, album, name)

  it('учитывается только первый исполнитель', () => {
    expect(compareKeys(t(['Zed', 'Adele']), t(['Adele', 'Zed']))).toBe(1)
    expect(compareKeys(t(['ABBA', 'Björk', 'A']), t(['A']))).toBe(1)
  })

  it('остальные исполнители не влияют: дальше решают альбом и название', () => {
    expect(compareKeys(t(['Adele', 'Zed'], '21'), t(['Adele'], '25'))).toBe(-1)
    expect(compareKeys(t(['Adele', 'Zed'], '21', 'n'), t(['Adele', 'Björk'], '21', 'n'))).toBe(0)
  })

  it('без исполнителей — как пустая строка', () => {
    expect(compareKeys(t([]), t(['']))).toBe(0)
    expect(compareKeys(t([]), t(['A']))).toBe(-1)
  })
})

describe('совпадение с эталонной реализацией на Python', () => {
  const items = fixture.items as Row[]

  it('sort_music_key', () => {
    const order = stableSort(items.map((_, i) => i), (a, b) => compareKeys(musicKey(items[a]!.title), musicKey(items[b]!.title)))
    expect(order).toEqual(fixture.music)
  })

  it('несколько исполнителей: ключ исходного скрипта по первому', () => {
    const multi = fixture.multiItems as Array<{ artists: string[]; album: string; title: string }>
    const key = (i: number) => trackKey(multi[i]!.artists, multi[i]!.album, multi[i]!.title)
    const order = stableSort(multi.map((_, i) => i), (a, b) => compareKeys(key(a), key(b)))
    expect(order).toEqual(fixture.tracksMulti)
  })

  it('sort_tracks_key', () => {
    const key = (i: number) => trackKey([items[i]!.artist], items[i]!.album, items[i]!.title)
    const order = stableSort(items.map((_, i) => i), (a, b) => compareKeys(key(a), key(b)))
    expect(order).toEqual(fixture.tracks)
  })
})
