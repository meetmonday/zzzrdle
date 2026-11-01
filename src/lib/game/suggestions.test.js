import { describe, it, expect } from 'vitest'
import { filterCharacters } from './suggestions.js'

describe('filterCharacters', () => {
  const chars = [
    { id: 1, name: 'Anby' },
    { id: 2, name: 'Anton' },
    { id: 3, name: 'Grace' },
  ]
  it('prefix first', () => {
    const r = filterCharacters(chars, 'an')
    expect(r.map(c => c.name)).toEqual(['Anby', 'Anton'])
  })
  it('empty query returns empty', () => {
    expect(filterCharacters(chars, '')).toEqual([])
  })
  it('case-insensitive', () => {
    expect(filterCharacters(chars, 'gr').map(c => c.name)).toEqual(['Grace'])
  })
})
