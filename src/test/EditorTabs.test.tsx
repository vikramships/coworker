import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditorTabs } from '../ui/components/EditorTabs'

describe('EditorTabs', () => {
  const mockOnTabClick = vi.fn()
  const mockOnTabClose = vi.fn()
  const mockOnTabSave = vi.fn()

  const sampleTabs = [
    {
      id: 'tab1',
      title: 'App.tsx',
      filePath: '/src/App.tsx',
      isDirty: false,
      isActive: true,
    },
    {
      id: 'tab2',
      title: 'utils.ts',
      filePath: '/src/utils.ts',
      isDirty: true,
      isActive: false,
    },
    {
      id: 'tab3',
      title: 'styles.css',
      filePath: '/src/styles.css',
      isDirty: false,
      isActive: false,
    },
  ]

  it('renders all tabs', () => {
    render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    expect(screen.getByText('App.tsx')).toBeInTheDocument()
    expect(screen.getByText('utils.ts')).toBeInTheDocument()
    expect(screen.getByText('styles.css')).toBeInTheDocument()
  })

  it('shows active tab styling', () => {
    render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    const activeTab = screen.getByText('App.tsx').parentElement?.parentElement
    expect(activeTab).toHaveClass('bg-surface')
    expect(activeTab).toHaveClass('border-b-2')
    expect(activeTab).toHaveClass('border-b-accent-500')
  })

  it('shows dirty indicator for modified files', () => {
    render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    // Should find the dirty indicator dot
    const utilsTab = screen.getByText('utils.ts').closest('div')
    const dirtyDot = utilsTab?.querySelector('.bg-accent-500.rounded-full')
    expect(dirtyDot).toBeInTheDocument()
  })

  it('calls onTabClick when tab is clicked', () => {
    render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    fireEvent.click(screen.getByText('utils.ts'))
    expect(mockOnTabClick).toHaveBeenCalledWith('tab2')
  })

  it('calls onTabClose when close button is clicked', () => {
    render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(btn => btn.getAttribute('aria-label') === 'Close tab')
    expect(closeButton).toBeDefined()

    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockOnTabClose).toHaveBeenCalledWith('tab1')
    }
  })

  it('shows save confirmation dialog when closing dirty tab', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    // Find the close button for the dirty tab (utils.ts)
    const utilsTab = screen.getByText('utils.ts').closest('div')
    const closeButton = utilsTab?.querySelector('button[aria-label="Close tab"]')
    expect(closeButton).toBeDefined()

    if (closeButton) {
      fireEvent.click(closeButton)
      expect(confirmSpy).toHaveBeenCalledWith('Save changes to utils.ts?')
      expect(mockOnTabSave).not.toHaveBeenCalled()
    }

    confirmSpy.mockRestore()
  })

  it('calls onTabSave when closing dirty tab and user confirms', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    // Find the close button for the dirty tab (utils.ts)
    const utilsTab = screen.getByText('utils.ts').closest('div')
    const closeButton = utilsTab?.querySelector('button[aria-label="Close tab"]')
    expect(closeButton).toBeDefined()

    if (closeButton) {
      fireEvent.click(closeButton)
      expect(confirmSpy).toHaveBeenCalledWith('Save changes to utils.ts?')
      expect(mockOnTabSave).toHaveBeenCalledWith('tab2')
    }

    confirmSpy.mockRestore()
  })

  it('shows "No files open" when no tabs', () => {
    render(
      <EditorTabs
        tabs={[]}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    expect(screen.getByText('No files open')).toBeInTheDocument()
  })

  it('shows correct file icons', () => {
    render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
      />
    )

    // TSX files should have 🔵 icon
    const appTab = screen.getByText('App.tsx').closest('div')
    expect(appTab?.textContent).toContain('🔵')

    // CSS files should have 🎨 icon
    const cssTab = screen.getByText('styles.css').closest('div')
    expect(cssTab?.textContent).toContain('🎨')
  })

  it('applies custom className', () => {
    const { container } = render(
      <EditorTabs
        tabs={sampleTabs}
        onTabClick={mockOnTabClick}
        onTabClose={mockOnTabClose}
        onTabSave={mockOnTabSave}
        className="custom-tabs"
      />
    )

    expect(container.firstChild).toHaveClass('custom-tabs')
  })
})