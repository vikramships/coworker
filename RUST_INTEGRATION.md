# Rust Integration in Coworker

## Overview

Coworker uses a hybrid architecture:
- **Frontend**: React 19 + TypeScript + Electron
- **Backend**: Node.js + Rust tools
- **Native Module**: napi-rs for custom performance-critical code

## Strategy

### Bundled Tools (fd, ripgrep, bat)

Popular Rust tools bundled with the app - no installation required.

| Tool | Purpose | Why Bundled? |
|------|---------|--------------|
| [fd](https://github.com/sharkdp/fd) | File finder | 10-50x faster than ls |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | Content search | Fastest grep |
| [bat](https://github.com/sharkdp/bat) | Syntax cat | Better than cat |

### Native Module (`/native`)

Custom Rust code compiled to Node.js native module.

**Features:**
- Fast file operations (read, write, list, search)
- Platform detection
- Git operations
- SQLite with bundled SQLcipher

**Building:**
```bash
cd native
cargo build --release
```

## Performance

| Operation | Node.js | Native Rust | Speedup |
|-----------|---------|-------------|---------|
| File read | ~5ms | ~0.5ms | 10x |
| File listing | ~50ms | ~5ms | 10x |
| Simple search | ~20ms | ~2ms | 10x |

## File Structure

```
native/
├── Cargo.toml           # Rust dependencies
├── src/
│   ├── lib.rs          # Entry point (exports functions)
│   ├── types.rs        # Type definitions
│   ├── git.rs          # Git operations
│   └── lsp.rs          # LSP server management
└── build.rs            # Build script
```

## Usage

```typescript
// Native fast operations (no subprocess)
const content = await window.electron.nativeReadFile('/path/to/file');
const files = await window.electron.nativeListDir('/path');
const exists = await window.electron.nativeFileExists('/path');
```

## CI/CD

Build native modules for all platforms:

```yaml
- name: Build native module
  run: |
    cd native
    cargo build --release --target x86_64-apple-darwin
    cargo build --release --target x86_64-unknown-linux-gnu
    cargo build --release --target x86_64-pc-windows-msvc
```
