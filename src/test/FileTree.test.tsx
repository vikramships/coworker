import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileTree } from '../ui/components/FileTree'

describe('FileTree', () => {
  const mockOnFileSelect = vi.fn()
  const mockOnFileContextMenu = vi.fn()

  const mockRootPath = '/test/project'

  it('renders file tree', () => {
    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    expect(screen.getByText('src')).toBeInTheDocument()
    expect(screen.getByText('main.tsx')).toBeInTheDocument()
  })

  it('renders file tree after loading', async () => {
    // Mock setTimeout to resolve immediately
    vi.useFakeTimers()

    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    // Fast-forward timers
    vi.advanceTimersToNextTimer()

    // Should render the mock file tree structure
    expect(screen.getByText('src')).toBeInTheDocument()
    expect(screen.getByText('components')).toBeInTheDocument()
    expect(screen.getByText('package.json')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('calls onFileSelect when file is clicked', async () => {
    vi.useFakeTimers()

    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    vi.advanceTimersToNextTimer()

    // Click on a file
    const appTsx = screen.getByText('App.tsx')
    fireEvent.click(appTsx)

    expect(mockOnFileSelect).toHaveBeenCalledWith('/test/project/src/components/App.tsx')

    vi.useRealTimers()
  })

  it('calls onFileContextMenu when right-clicking file', async () => {
    vi.useFakeTimers()

    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    vi.advanceTimersToNextTimer()

    // Right-click on a file
    const sidebarTsx = screen.getByText('Sidebar.tsx')
    fireEvent.contextMenu(sidebarTsx)

    expect(mockOnFileContextMenu).toHaveBeenCalledWith(
      '/test/project/src/components/Sidebar.tsx',
      expect.any(Object)
    )

    vi.useRealTimers()
  })

  it('displays correct file icons', async () => {
    vi.useFakeTimers()

    render(
      <FileTree
        rootPath={mockRootPath}
        onFileSelect={mockOnFileSelect}
        onFileContextMenu={mockOnFileContextMenu}
      />
    )

    vi.advanceTimersToNextTimer()

    // Check for directory icon (📁)
    const srcDir = screen.getByText('src').closest('div')
    expect(srcDir?.textContent).toContain('📁')

    // Check for TSX file icon (🔵)
    const appTsx = screen.getByText('App.tsx').closest('div')
    expect(appTsx?.textContent).toContain('🔵')

    // Check for JSON file icon (📋)
    const packageJson = screen.getByText('package.json').closest('div')
    expect(packageJson?.textContent).toContain('📋')

    vi.useRealTimers()
  })
})