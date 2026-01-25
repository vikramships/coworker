# Bug Report: Prompt Input Not Editable in StartSessionModal

## Summary
Users cannot type in the prompt textarea within the Start New Session modal.

## Steps to Reproduce
1. Open Coworker app
2. Click "New Session" button
3. Attempt to type in the prompt textarea

## Expected Behavior
Text should appear as user types.

## Actual Behavior
- Textarea appears but input is not registered
- No characters appear when typing
- No console errors in dev tools
- Button remains disabled (might be related)

## Environment
- macOS
- Electron 39.3.0
- React 19.2.3

## Files Involved
- `src/ui/components/StartSessionModal.tsx` - The modal component
- `src/ui/App.tsx` - Parent component that renders the modal

## Code Context

### StartSessionModal.tsx
```tsx
// Current implementation with the issue
export function StartSessionModal({
  cwd,
  prompt,
  pendingStart,
  onCwdChange,
  onPromptChange,
  onStart,
  onClose,
}: StartSessionModalProps) {
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [recentCwds, setRecentCwds] = useState<string[]>([]);

  // Sync with external prompt changes
  useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt]);

  // ...

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-ink-900/10 bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prompt textarea */}
        <textarea
          value={localPrompt}
          onChange={(e) => {
            setLocalPrompt(e.target.value);
            onPromptChange(e.target.value);
          }}
          placeholder="Describe your task..."
          rows={4}
          className="w-full px-4 py-3 text-sm bg-surface-secondary border border-ink-900/10 rounded-xl text-ink-800 placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none"
        />
        {/* ... */}
      </div>
    </div>
  );
}
```

### App.tsx (how modal is rendered)
```tsx
{showStartModal && (
  <StartSessionModal
    cwd={cwd}
    prompt={prompt}
    pendingStart={pendingStart}
    onCwdChange={setCwd}
    onPromptChange={setPrompt}
    onStart={handleStartFromModal}
    onClose={() => setShowStartModal(false)}
  />
)}
```

## Things Already Tried
1. Added `autoFocus` prop - didn't help
2. Added `console.log` in onChange - no logs appear
3. Simplified the component, removed complex animations
4. Added `e.stopPropagation()` to prevent backdrop click
5. Checked for CSS `pointer-events: none` issues
6. Verified `onChange` handler is called correctly

## Possible Causes
1. React 19 event handling differences
2. z-index stacking issue blocking interaction
3. Electron/WebView rendering issue
4. State conflict between `localPrompt` and `prompt` prop
5. React.StrictMode double-rendering causing issues

## Expected Fix Approach
- Check if there's a conflict between local state and prop
- Verify event propagation is correct
- Check if any parent component is preventing focus/input
- Try using controlled vs uncontrolled input pattern
- Check for any global event handlers that might intercept keyboard events

## Additional Notes
- The CWD input field also has the same issue (cannot edit)
- This suggests a deeper issue with the modal or parent component
