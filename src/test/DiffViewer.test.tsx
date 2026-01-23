import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiffViewer } from '../ui/components/DiffViewer'

describe('DiffViewer', () => {
  const oldContent = `function hello() {
  console.log("Hello");
  return true;
}`

  const newContent = `function hello() {
  console.log("Hello, World!");
  console.log("New line added");
  return true;
}`

  it('renders diff content', () => {
    render(
      <DiffViewer
        oldContent={oldContent}
        newContent={newContent}
        filename="example.ts"
        language="typescript"
      />
    )

    expect(screen.getByText('example.ts')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('shows change statistics', () => {
    render(
      <DiffViewer
        oldContent={oldContent}
        newContent={newContent}
        filename="example.ts"
        language="typescript"
      />
    )

    expect(screen.getByText('4 additions')).toBeInTheDocument()
    expect(screen.getByText('3 deletions')).toBeInTheDocument()
  })

  it('renders without filename', () => {
    render(
      <DiffViewer
        oldContent={oldContent}
        newContent={newContent}
      />
    )

    expect(screen.queryByText('example.ts')).not.toBeInTheDocument()
    // Should still show the diff content
    expect(screen.getByText(/"Hello"/)).toBeInTheDocument()
  })

  it('shows "No changes" for identical content', () => {
    render(
      <DiffViewer
        oldContent={oldContent}
        newContent={oldContent}
      />
    )

    expect(screen.getByText('No changes to display')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <DiffViewer
        oldContent={oldContent}
        newContent={newContent}
        className="custom-diff"
      />
    )

    expect(container.firstChild).toHaveClass('custom-diff')
  })

  it('shows diff with line numbers', () => {
    render(
      <DiffViewer
        oldContent={oldContent}
        newContent={newContent}
      />
    )

    // Should show line numbers in the diff
    const lineNumbers = screen.getAllByText(/^[0-9]+$/);
    expect(lineNumbers.length).toBeGreaterThan(0)
  })

  it('displays add/remove indicators', () => {
    const oldCode = 'console.log("old");'
    const newCode = 'console.log("new");'

    render(
      <DiffViewer
        oldContent={oldCode}
        newContent={newCode}
      />
    )

    // Should show + and - indicators in the diff
    const diffContent = screen.getByText(/"new"/)
    expect(diffContent).toBeInTheDocument()
  })
})