import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Terminal } from '../ui/components/Terminal'

describe('Terminal', () => {
  const mockOnCommand = vi.fn()

  it('renders terminal with prompt', () => {
    render(<Terminal cwd="~" onCommand={mockOnCommand} />)

    expect(screen.getByText('Welcome to Coworker Terminal')).toBeInTheDocument()
    expect(screen.getByText('Type \'help\' for available commands.')).toBeInTheDocument()
    expect(screen.getByText('~ $')).toBeInTheDocument()
  })

  it('executes help command', async () => {
    render(<Terminal cwd="/home/user" onCommand={mockOnCommand} />)

    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: 'help' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('/home/user $ help')).toBeInTheDocument()
      expect(screen.getByText('Available commands:')).toBeInTheDocument()
    })

    expect(mockOnCommand).toHaveBeenCalledWith('help')
  }, 10000)

  it('executes pwd command', async () => {
    render(<Terminal cwd="/home/user" onCommand={mockOnCommand} />)

    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: 'pwd' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('/home/user $ pwd')).toBeInTheDocument()
      expect(screen.getByText('/home/user')).toBeInTheDocument()
    }, { timeout: 5000 })

    expect(mockOnCommand).toHaveBeenCalledWith('pwd')
  })
  })

  it('executes ls command', async () => {
    render(<Terminal cwd="/home/user" onCommand={mockOnCommand} />)

    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: 'ls' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('/home/user $ ls')).toBeInTheDocument()
      expect(screen.getByText('src/    package.json    README.md    tsconfig.json')).toBeInTheDocument()
    })
  })

  it('executes echo command', async () => {
    render(<Terminal cwd="/home/user" onCommand={mockOnCommand} />)

    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: 'echo Hello World' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('/home/user $ echo Hello World')).toBeInTheDocument()
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
  })

  it('handles unknown commands', async () => {
    render(<Terminal cwd="/home/user" onCommand={mockOnCommand} />)

    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: 'unknowncommand' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('/home/user $ unknowncommand')).toBeInTheDocument()
      expect(screen.getByText('Command not found: unknowncommand')).toBeInTheDocument()
    })
  })

  it('clears terminal with clear command', async () => {
    render(<Terminal cwd="/home/user" onCommand={mockOnCommand} />)

    // First add some content
    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: 'pwd' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('/home/user $ pwd')).toBeInTheDocument()
    })

    // Now clear
    const input2 = screen.getByDisplayValue('')
    fireEvent.change(input2, { target: { value: 'clear' } })
    fireEvent.submit(input2.closest('form')!)

    await waitFor(() => {
      expect(screen.queryByText('/home/user $ pwd')).not.toBeInTheDocument()
    })
  })

  it('supports command history with arrow keys', async () => {
    render(<Terminal cwd="/home/user" onCommand={mockOnCommand} />)

    // Execute a command
    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: 'pwd' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('/home/user $ pwd')).toBeInTheDocument()
    })

    // Try to access history
    const input2 = screen.getByDisplayValue('')
    fireEvent.keyDown(input2, { key: 'ArrowUp' })

    expect(input2).toHaveValue('pwd')
  })

  it('clears input after command execution', async () => {
    render(<Terminal cwd="/home/user" onCommand={mockOnCommand} />)

    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: 'pwd' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('/home/user $ pwd')).toBeInTheDocument()
    })

    const newInput = screen.getByDisplayValue('')
    expect(newInput).toHaveValue('')
  })

  it('shows current working directory in prompt', () => {
    render(<Terminal cwd="/custom/path" onCommand={mockOnCommand} />)

    expect(screen.getByText('/custom/path $')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Terminal
        cwd="~"
        onCommand={mockOnCommand}
        className="custom-terminal"
      />
    )

    expect(container.firstChild).toHaveClass('custom-terminal')
  })