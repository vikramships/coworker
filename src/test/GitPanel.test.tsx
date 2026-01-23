import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GitPanel } from '../ui/components/GitPanel'

describe('GitPanel', () => {
  const mockRepoPath = '/test/repo'

  it('renders Git panel with loading state initially', () => {
    render(<GitPanel repoPath={mockRepoPath} />)

    expect(screen.getByText('Git')).toBeInTheDocument()
    expect(screen.getByText('Repository')).toBeInTheDocument()
  })

  it('loads and displays Git status after loading', async () => {
    // Mock setTimeout to resolve immediately
    vi.useFakeTimers()

    render(<GitPanel repoPath={mockRepoPath} />)

    vi.advanceTimersToNextTimer()

    await waitFor(() => {
      expect(screen.getByText('Changes')).toBeInTheDocument()
      expect(screen.getByText('History')).toBeInTheDocument()
      expect(screen.getByText('Diff')).toBeInTheDocument()
    })

    // Should show mock status entries
    expect(screen.getByText('src/main.ts')).toBeInTheDocument()
    expect(screen.getByText('Modified')).toBeInTheDocument()
    expect(screen.getByText('package.json')).toBeInTheDocument()
    expect(screen.getByText('README.md')).toBeInTheDocument()
    expect(screen.getByText('Added')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('shows change statistics', async () => {
    vi.useFakeTimers()

    render(<GitPanel repoPath={mockRepoPath} />)

    vi.advanceTimersToNextTimer()

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // 3 files in status
    })

    vi.useRealTimers()
  })

  it('switches between tabs', async () => {
    vi.useFakeTimers()

    render(<GitPanel repoPath={mockRepoPath} />)

    vi.advanceTimersToNextTimer()

    await waitFor(() => {
      expect(screen.getByText('Changes')).toBeInTheDocument()
    })

    // Click on History tab
    fireEvent.click(screen.getByText('History'))
    expect(screen.getByText('commit')).toBeInTheDocument()

    // Click on Diff tab
    fireEvent.click(screen.getByText('Diff'))
    expect(screen.getByText('Diff view coming soon...')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('shows commit interface when files are selected', async () => {
    vi.useFakeTimers()

    render(<GitPanel repoPath={mockRepoPath} />)

    vi.advanceTimersToNextTimer()

    await waitFor(() => {
      expect(screen.getByText('src/main.ts')).toBeInTheDocument()
    })

    // Select files by clicking checkboxes
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]) // Select first file
    fireEvent.click(checkboxes[1]) // Select second file

    // Should show commit interface
    expect(screen.getByText('Commit Changes')).toBeInTheDocument()
    expect(screen.getByText('2 files selected')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('handles commit with message', async () => {
    vi.useFakeTimers()

    render(<GitPanel repoPath={mockRepoPath} />)

    vi.advanceTimersToNextTimer()

    await waitFor(() => {
      expect(screen.getByText('src/main.ts')).toBeInTheDocument()
    })

    // Select a file
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    // Enter commit message
    const textarea = screen.getByPlaceholderText('Enter commit message...')
    fireEvent.change(textarea, { target: { value: 'Fix bug in main component' } })

    // Click commit button
    const commitButton = screen.getByText('Commit')
    fireEvent.click(commitButton)

    // Should clear the form and reload
    expect(textarea).toHaveValue('')

    vi.useRealTimers()
  })

  it('disables commit button when message is empty', async () => {
    vi.useFakeTimers()

    render(<GitPanel repoPath={mockRepoPath} />)

    vi.advanceTimersToNextTimer()

    await waitFor(() => {
      expect(screen.getByText('src/main.ts')).toBeInTheDocument()
    })

    // Select a file
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    // Commit button should be disabled without message
    const commitButton = screen.getByText('Commit')
    expect(commitButton).toBeDisabled()

    vi.useRealTimers()
  })

  it('shows commit history', async () => {
    vi.useFakeTimers()

    render(<GitPanel repoPath={mockRepoPath} />)

    vi.advanceTimersToNextTimer()

    await waitFor(() => {
      expect(screen.getByText('Changes')).toBeInTheDocument()
    })

    // Switch to History tab
    fireEvent.click(screen.getByText('History'))

    expect(screen.getByText('Add new feature')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Fix bug in component')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('applies custom className', () => {
    const { container } = render(
      <GitPanel
        repoPath={mockRepoPath}
        className="custom-git-panel"
      />
    )

    expect(container.firstChild).toHaveClass('custom-git-panel')
  })
})