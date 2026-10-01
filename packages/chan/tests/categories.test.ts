import { describe, expect, it } from 'vitest'

import {
  aiCategoryToAction,
  classificationToAction,
  isChanAction,
  CHAN_ACTIONS,
} from '../src/categories.js'

describe('categories', () => {
  it('maps each chan-ai category to a keepachangelog verb', () => {
    expect(aiCategoryToAction('Feature')).toBe('added')
    expect(aiCategoryToAction('Fix')).toBe('fixed')
    expect(aiCategoryToAction('Security')).toBe('security')
    expect(aiCategoryToAction('Refactor')).toBe('changed')
    expect(aiCategoryToAction('Performance')).toBe('changed')
    expect(aiCategoryToAction('Documentation')).toBe('changed')
  })

  it('classificationToAction picks the most specific verb', () => {
    expect(classificationToAction(['Feature', 'Refactor'])).toBe('added')
    expect(classificationToAction(['Refactor', 'Security'])).toBe('security')
    expect(classificationToAction(['Fix', 'Feature'])).toBe('fixed')
    expect(classificationToAction(['Chore'])).toBe('changed')
  })

  it('isChanAction guards the chan verb set', () => {
    for (const action of CHAN_ACTIONS) {
      expect(isChanAction(action)).toBe(true)
    }
    expect(isChanAction('nope')).toBe(false)
  })
})
