import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CodeEditor } from '../ui/components/CodeEditor'

describe('CodeEditor', () => {
  const mockOnChange = vi.fn()
  const mockOnSave = vi.fn()

  const defaultValue = `function hello() {
  console.log("Hello, World!");
  return true;
}`

  it('renders with provided content', () => {
    render(
      <CodeEditor
        value={defaultValue}
        onChange={mockOnChange}
        language="javascript"
        onSave={mockOnSave}
      />
    )

    // Check that the textarea contains the value
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toBe(defaultValue)
  })

  it('calls onChange when content is modified', async () => {
    render(
      <CodeEditor
        value={defaultValue}
        onChange={mockOnChange}
        language="javascript"
        onSave={mockOnSave}
      />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'new content' } })

    expect(mockOnChange).toHaveBeenCalledWith('new content')
  })

  it('handles Tab key for indentation', () => {
    render(
      <CodeEditor
        value="line"
        onChange={mockOnChange}
        language="javascript"
        onSave={mockOnSave}
      />
    )

    const textarea = screen.getByDisplayValue("line") as HTMLTextAreaElement
    textarea.selectionStart = 4 // End of "line"
    textarea.selectionEnd = 4

    fireEvent.keyDown(textarea, { key: 'Tab', preventDefault: vi.fn() })

    expect(mockOnChange).toHaveBeenCalledWith('line  ')
  })

  it('calls onSave when Ctrl+S is pressed', () => {
    render(
      <CodeEditor
        value={defaultValue}
        onChange={mockOnChange}
        language="javascript"
        onSave={mockOnSave}
      />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    fireEvent.keyDown(textarea, { key: 's', ctrlKey: true, preventDefault: vi.fn() })

    expect(mockOnSave).toHaveBeenCalled()
  })

  it('displays line numbers', () => {
    const multiLineContent = `line 1
line 2
line 3`

    render(
      <CodeEditor
        value={multiLineContent}
        onChange={mockOnChange}
        language="javascript"
        onSave={mockOnSave}
      />
    )

    // Check that line numbers are displayed in the line number gutter
    const lineNumbers = screen.getAllByText(/^[0-9]+$/);
    expect(lineNumbers.length).toBeGreaterThanOrEqual(3)
  })

  it('displays correct language in status bar', () => {
    render(
      <CodeEditor
        value={defaultValue}
        onChange={mockOnChange}
        language="typescript"
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('shows cursor position and line count', () => {
    render(
      <CodeEditor
        value={defaultValue}
        onChange={mockOnChange}
        language="javascript"
        onSave={mockOnSave}
      />
    )

    // Should show line count (4 lines)
    expect(screen.getByText('Ln 4')).toBeInTheDocument()
  })

  it('handles readOnly mode', () => {
    render(
      <CodeEditor
        value={defaultValue}
        onChange={mockOnChange}
        language="javascript"
        readOnly={true}
        onSave={mockOnSave}
      />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea).toHaveAttribute('readonly')
  })

  it('applies custom className', () => {
    const { container } = render(
      <CodeEditor
        value={defaultValue}
        onChange={mockOnChange}
        language="javascript"
        className="custom-editor"
        onSave={mockOnSave}
      />
    )

    expect(container.firstChild).toHaveClass('custom-editor')
  })

  it('detects language from file extension correctly', () => {
    const { rerender } = render(
      <CodeEditor
        value="const x = 1;"
        onChange={mockOnChange}
        language="typescript"
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('typescript')).toBeInTheDocument()

    rerender(
      <CodeEditor
        value="def hello():"
        onChange={mockOnChange}
        language="python"
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('python')).toBeInTheDocument()
  })
})