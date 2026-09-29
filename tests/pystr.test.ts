import { describe, expect, it } from 'vitest'
import { comparePy, lastChar, notUpperFlag, pyIsUpperChar } from '../src/domain/pystr'

describe('comparePy', () => {
  it('сравнивает по кодовым точкам, а не по UTF-16', () => {
    const astral = '\u{1F600}'
    const bmpHigh = 'Ａ'
    expect(astral < bmpHigh).toBe(true)
    expect(comparePy(astral, bmpHigh)).toBe(1)
    expect(comparePy(bmpHigh, astral)).toBe(-1)
  })

  it('равные строки', () => {
    expect(comparePy('abc', 'abc')).toBe(0)
    expect(comparePy('', '')).toBe(0)
  })

  it('префикс меньше', () => {
    expect(comparePy('ab', 'abc')).toBe(-1)
    expect(comparePy('abc', 'ab')).toBe(1)
    expect(comparePy('', 'a')).toBe(-1)
  })

  it('латиница раньше кириллицы, ё после я', () => {
    expect(comparePy('z', 'а')).toBe(-1)
    expect(comparePy('я', 'ё')).toBe(-1)
    expect(comparePy('е', 'ё')).toBe(-1)
  })

  it('цифры и знаки раньше букв', () => {
    expect(comparePy('1', 'a')).toBe(-1)
    expect(comparePy('(', '1')).toBe(-1)
    expect(comparePy(' ', '!')).toBe(-1)
  })
})

describe('isupper последнего символа', () => {
  it('латиница и кириллица', () => {
    expect(notUpperFlag('abC')).toBe('False')
    expect(notUpperFlag('abc')).toBe('True')
    expect(notUpperFlag('приВЕТ')).toBe('False')
    expect(notUpperFlag('Привет')).toBe('True')
    expect(notUpperFlag('Ё')).toBe('False')
  })

  it('не-буквы дают True', () => {
    expect(notUpperFlag('ABC1')).toBe('True')
    expect(notUpperFlag('ABC)')).toBe('True')
    expect(notUpperFlag('ABC!')).toBe('True')
    expect(notUpperFlag('ABC ')).toBe('True')
    expect(notUpperFlag('ABC\u{1F600}')).toBe('True')
  })

  it('пустая строка не падает', () => {
    expect(notUpperFlag('')).toBe('True')
    expect(lastChar('')).toBe('')
  })

  it('суррогатные пары считаются одним символом', () => {
    expect(lastChar('a\u{1D400}')).toBe('\u{1D400}')
    expect(notUpperFlag('a\u{1D400}')).toBe('False')
    expect(notUpperFlag('a\u{1D41A}')).toBe('True')
  })

  it('титульный регистр и Other_Uppercase как в Python', () => {
    expect(pyIsUpperChar('ǅ')).toBe(false)
    expect(pyIsUpperChar('Ⓐ')).toBe(true)
    expect(pyIsUpperChar('ⓐ')).toBe(false)
  })
})
