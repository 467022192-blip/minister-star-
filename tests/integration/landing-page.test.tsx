import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from '../../app/page'

describe('HomePage', () => {
  it('shows a quiz-first CTA for social traffic', () => {
    render(<HomePage />)
    expect(screen.getByText('先做一个轻测试')).toBeInTheDocument()
  })
})
