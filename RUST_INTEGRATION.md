# Rust Tools Integration

Coworker uses popular, battle-tested Rust tools for maximum performance.

## Core Tools

These are installed and used via subprocess:

| Tool | Purpose | Why Rust? |
|------|---------|-----------|
| [fd](https://github.com/sharkdp/fd) | File finder | 10-50x faster than `ls` |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | Content search | Fastest grep alternative |
| [bat](https://github.com/sharkdp/bat) | Syntax cat | Syntax highlighting, paging |
| [eza](https://github.com/eza-community/eza) | Modern ls | Better defaults, colors |
| [bottom](https://github.com/clementtsang/bottom) | Process monitor | Cross-platform, pretty |

## Installation

```bash
# Using cargo (recommended)
cargo install fd-find ripgrep bat eza bottom

# Or via package manager
brew install fd ripgrep bat eza bottom  # macOS
apt install fd-find ripgrep bat eza     # Ubuntu/Debian
```

## Integration

### File Tree (fd)
```typescript
// src/electron/libs/fd.ts
import { execSync } from "child_process";

export function fdList(cwd: string, options?: FdOptions): FdFileInfo[] {
  const args = ["--type", "f", "--color", "never"];
  const output = execSync(`fd ${args.join(" ")}`, { cwd, encoding: "utf-8" });
  return output.split("\n").filter(Boolean).map(path => ({ path }));
}
```

### Search (ripgrep)
```typescript
// src/electron/libs/rg.ts
import { execSync } from "child_process";

export function rgSearch(cwd: string, query: string): RgMatch[] {
  const output = execSync(`rg --json -e "${query}"`, { cwd, encoding: "utf-8" });
  return output.split("\n").filter(Boolean).map(JSON.parse);
}
```

## Performance

| Operation | Node.js | Rust Tool | Speedup |
|-----------|---------|-----------|---------|
| `ls -la` (1000 files) | ~500ms | `fd -la` ~50ms | 10x |
| `grep -r "foo"` | ~200ms | `rg "foo"` ~10ms | 20x |
| `cat file.rs` | Plain text | `bat file.rs` | Colored |

## Future Improvements

- **zoxide** - Smart `cd` with fuzzy matching
- **procs** - Modern `ps`
- **nu** - Shell with built-in Rust tools

## Philosophy

> Use the best tool for the job. Rust tools are battle-tested and fast. Don't reinvent the wheel.

We prefer:
- ✅ Famous, well-maintained tools
- ✅ Actively developed projects
- ✅ Cross-platform support
- ✅ Minimal configuration

Avoid:
- ❌ Niche/unmaintained tools
- ❌ Overly complex integrations
- ❌ Duplicate functionality
