import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MDContent from '../ui/render/markdown'

describe('MDContent', () => {
  it('renders plain text correctly', () => {
    render(<MDContent text="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders markdown correctly', () => {
    render(<MDContent text="# Hello\n\nThis is **bold** text." />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello')
    expect(screen.getByText(/This is/)).toBeInTheDocument()
    expect(screen.getByText('bold')).toHaveClass('font-semibold')
  })

  it('handles null input gracefully', () => {
    render(<MDContent text={null as unknown as string} />)
    // Should not crash and render nothing
    expect(screen.queryByText(/.+/)).not.toBeInTheDocument()
  })

  it('handles undefined input gracefully', () => {
    render(<MDContent text={undefined as unknown as string} />)
    // Should not crash and render nothing
    expect(screen.queryByText(/.+/)).not.toBeInTheDocument()
  })

  it('converts objects to JSON strings', () => {
    const testObject = { key: 'value', number: 42 }
    render(<MDContent text={testObject as unknown as string} />)
    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument()
    expect(screen.getByText(/"number": 42/)).toBeInTheDocument()
  })

  it('converts arrays to JSON strings', () => {
    const testArray = [1, 2, { nested: 'object' }]
    render(<MDContent text={testArray as unknown as string} />)
    expect(screen.getByText(/1,/)).toBeInTheDocument()
    expect(screen.getByText(/"nested": "object"/)).toBeInTheDocument()
  })

  it('handles circular references gracefully', () => {
    const circularObj = { prop: 'value' } as { prop: string; self?: unknown }
    circularObj.self = circularObj

    render(<MDContent text={circularObj as unknown as string} />)
    // Should fall back to String() representation
    expect(screen.getByText('[object Object]')).toBeInTheDocument()
  })

  it('handles objects with text property correctly', () => {
    const objWithText = { text: 'This is the text content' }
    render(<MDContent text={objWithText as unknown as string} />)
    expect(screen.getByText('This is the text content')).toBeInTheDocument()
  })

  it('converts numbers to strings', () => {
    render(<MDContent text={42 as unknown as string} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('converts booleans to strings', () => {
    render(<MDContent text={true as unknown as string} />)
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('handles empty objects', () => {
    render(<MDContent text={{} as unknown as string} />)
    expect(screen.getByText('{}')).toBeInTheDocument()
  })

  it('handles empty arrays', () => {
    render(<MDContent text={[] as unknown as string} />)
    expect(screen.getByText('[]')).toBeInTheDocument()
  })
})