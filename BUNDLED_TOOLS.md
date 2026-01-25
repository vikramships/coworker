# Bundled Rust Tools

Coworker bundles popular Rust tools for maximum performance without requiring users to install anything.

## Bundled Tools

| Tool | Purpose | Version |
|------|---------|---------|
| [fd](https://github.com/sharkdp/fd) | Fast file finder | 9.1.0 |
| [ripgrep](https://github.com/BurntSushi/ripgrep) | Content search | 14.1.0 |
| [bat](https://github.com/sharkdp/bat) | Syntax cat | 25.1.0 |

## How It Works

1. **Download Script**: `scripts/download-binaries.sh`
   - Downloads pre-built binaries from GitHub releases
   - Extracts to `bin/` directory

2. **Bundling**: `electron-builder.json`
   - `extraResources` includes `bin/` folder
   - Binaries packaged with the app

3. **Runtime**: 
   - Binaries located at `process.resourcesPath/bin/`
   - Libraries check bundled first, fallback to system PATH

## Installation

**Nothing required!** All tools are bundled with the app.

## For Developers

### Updating Binaries

```bash
# Download latest binaries for current platform
./scripts/download-binaries.sh

# Verify
ls -la bin/
```

### Building for Distribution

```bash
# Download all platform binaries
./scripts/download-binaries.sh

# Build for macOS
bun run dist:mac

# Build for Linux
bun run dist:linux

# Build for Windows
bun run dist:win
```

### CI/CD (GitHub Actions)

The download script is called during build to ensure fresh binaries.

## Why Bundle?

- ✅ No manual installation required
- ✅ Consistent versions across users
- ✅ Works offline
- ✅ Fast performance without dependencies
- ✅ Single portable app

## Technical Details

- Binaries stored in `resources/bin/` (macOS/Linux)
- Windows equivalent: `resources/bin/`
- Fallback to system PATH if bundled binary missing
- All binaries are statically linked for portability
