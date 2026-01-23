import { describe, it, expect, vi } from 'vitest'

// Test the safeStringify function (extracted from EventCard)
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

describe('safeStringify', () => {
  it('returns empty string for null', () => {
    expect(safeStringify(null)).toBe("");
  });

  it('returns empty string for undefined', () => {
    expect(safeStringify(undefined)).toBe("");
  });

  it('returns string as-is', () => {
    expect(safeStringify("hello world")).toBe("hello world");
  });

  it('converts numbers to strings', () => {
    expect(safeStringify(42)).toBe("42");
    expect(safeStringify(3.14)).toBe("3.14");
  });

  it('converts booleans to strings', () => {
    expect(safeStringify(true)).toBe("true");
    expect(safeStringify(false)).toBe("false");
  });

  it('converts objects to JSON strings', () => {
    const obj = { key: 'value', number: 42 };
    expect(safeStringify(obj)).toBe(JSON.stringify(obj, null, 2));
  });

  it('converts arrays to JSON strings', () => {
    const arr = [1, 2, 'three'];
    expect(safeStringify(arr)).toBe(JSON.stringify(arr, null, 2));
  });

  it('handles nested objects', () => {
    const nested = { outer: { inner: 'value' } };
    expect(safeStringify(nested)).toBe(JSON.stringify(nested, null, 2));
  });

  it('handles circular references gracefully', () => {
    const circular = { prop: 'value' } as { prop: string; self?: unknown };
    circular.self = circular;

    // Should fall back to String() for circular references
    expect(safeStringify(circular)).toBe('[object Object]');
  });

  it('handles complex objects', () => {
    const complex = {
      string: 'text',
      number: 123,
      boolean: true,
      array: [1, 2, 3],
      nested: { key: 'value' }
    };
    expect(safeStringify(complex)).toBe(JSON.stringify(complex, null, 2));
  });
});

// Test the getPartialMessageContent function (extracted from App)
function getPartialMessageContent(eventMessage: {
  delta?: {
    type?: string;
    [key: string]: unknown;
  } | null;
}) {
  try {
    const delta = eventMessage.delta;
    if (!delta) return "";

    const deltaType = delta.type;
    if (!deltaType) return "";

    const contentKey = deltaType.replace("_delta", "");
    const content = delta[contentKey];

    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      return (content as { text?: string }).text || safeStringify(content);
    }
    return safeStringify(content);
  } catch (error) {
    console.error("Error extracting partial message content:", error);
    return "";
  }
}

describe('getPartialMessageContent', () => {
  it('returns empty string for no delta', () => {
    expect(getPartialMessageContent({})).toBe("");
  });

  it('extracts text from text_delta', () => {
    const message = {
      delta: {
        type: 'text_delta',
        text: 'Hello world'
      }
    };
    expect(getPartialMessageContent(message)).toBe('Hello world');
  });

  it('extracts text from thinking_delta', () => {
    const message = {
      delta: {
        type: 'thinking_delta',
        thinking: 'I am thinking...'
      }
    };
    expect(getPartialMessageContent(message)).toBe('I am thinking...');
  });

  it('handles object content with text property', () => {
    const message = {
      delta: {
        type: 'text_delta',
        text: { text: 'Extracted text' }
      }
    };
    expect(getPartialMessageContent(message)).toBe('Extracted text');
  });

  it('handles object content without text property', () => {
    const message = {
      delta: {
        type: 'text_delta',
        text: { key: 'value', number: 42 }
      }
    };
    expect(getPartialMessageContent(message)).toBe(JSON.stringify({ key: 'value', number: 42 }, null, 2));
  });

  it('handles array content', () => {
    const message = {
      delta: {
        type: 'text_delta',
        text: [1, 2, 3]
      }
    };
    expect(getPartialMessageContent(message)).toBe(JSON.stringify([1, 2, 3], null, 2));
  });

  it('handles null content', () => {
    const message = {
      delta: {
        type: 'text_delta',
        text: null
      }
    };
    expect(getPartialMessageContent(message)).toBe("");
  });

  it('handles undefined content', () => {
    const message = {
      delta: {
        type: 'text_delta',
        text: undefined
      }
    };
    expect(getPartialMessageContent(message)).toBe("");
  });

  it('handles malformed delta gracefully', () => {
    const message = {
      delta: null
    };
    expect(getPartialMessageContent(message)).toBe("");
  });

  it('handles exceptions gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Pass a delta that will cause an exception when accessing properties
    const message = { delta: { type: 'test_delta' } } as any;
    // Mock the delta to throw when accessing properties
    Object.defineProperty(message.delta, 'test', {
      get() { throw new Error('Test error'); }
    });
    expect(getPartialMessageContent(message)).toBe("");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles missing content key', () => {
    const message = {
      delta: {
        type: 'unknown_delta'
      }
    };
    expect(getPartialMessageContent(message)).toBe("");
  });
});