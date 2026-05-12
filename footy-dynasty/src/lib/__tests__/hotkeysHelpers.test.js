import { describe, it, expect } from 'vitest'
import { isTypingTarget } from '../hotkeysHelpers.js'

describe('hotkeysHelpers', () => {
  it('isTypingTarget returns false for nullish', () => {
    expect(isTypingTarget(null)).toBe(false)
    expect(isTypingTarget(undefined)).toBe(false)
  })

  it('isTypingTarget detects form controls', () => {
    expect(isTypingTarget({ tagName: 'INPUT', isContentEditable: false })).toBe(true)
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true)
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true)
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false)
  })

  it('isTypingTarget respects contenteditable', () => {
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true)
  })

  it('isTypingTarget respects role textbox', () => {
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: false, getAttribute: () => 'textbox' })).toBe(true)
  })
})
