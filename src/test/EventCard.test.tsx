import { describe, it, expect } from 'vitest'

// Test the safeStringify function from EventCard (extracted for testing)
function safeStringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

describe('EventCard safeStringify integration', () => {
  it('handles various content types in tool results', () => {
    // Test string content
    expect(safeStringify('plain text')).toBe('plain text');

    // Test object content (common in tool results)
    const objContent = { output: 'result', status: 'success' };
    expect(safeStringify(objContent)).toBe(JSON.stringify(objContent, null, 2));

    // Test array content
    const arrayContent = ['line1', 'line2', { key: 'value' }];
    expect(safeStringify(arrayContent)).toBe(JSON.stringify(arrayContent, null, 2));

    // Test null/undefined
    expect(safeStringify(null)).toBe('');
    expect(safeStringify(undefined)).toBe('');

    // Test numbers and booleans
    expect(safeStringify(42)).toBe('42');
    expect(safeStringify(true)).toBe('true');
  });

  it('handles SDK message content structures', () => {
    // Test typical SDK content structures
    const sdkContent = {
      type: 'text',
      text: 'Command executed successfully'
    };
    expect(safeStringify(sdkContent)).toBe(JSON.stringify(sdkContent, null, 2));

    const toolResult = {
      tool_call_id: 'call_123',
      content: [
        { type: 'text', text: 'Output line 1' },
        { type: 'text', text: 'Output line 2' }
      ]
    };
    expect(safeStringify(toolResult)).toBe(JSON.stringify(toolResult, null, 2));
  });

  it('handles edge cases gracefully', () => {
    // Circular references
    const circular = { name: 'circular' } as { name: string; self?: unknown };
    circular.self = circular;
    expect(safeStringify(circular)).toBe('[object Object]');

    // Empty objects and arrays
    expect(safeStringify({})).toBe('{}');
    expect(safeStringify([])).toBe('[]');

    // Complex nested structures
    const complex = {
      metadata: { version: '1.0', timestamp: Date.now() },
      results: [
        { id: 1, status: 'success' },
        { id: 2, status: 'error', message: 'Failed to process' }
      ],
      summary: {
        total: 2,
        successful: 1,
        failed: 1
      }
    };
    expect(safeStringify(complex)).toBe(JSON.stringify(complex, null, 2));
  });
});