# Coworker

A modern chat interface for collaborating with Claude Code, built with React, TypeScript, and Electron.

## Features

- 💬 **Chat Interface**: Clean, modern chat UI for interacting with Claude
- 🛠️ **Tool Integration**: Execute commands, read/write files, and run tools
- ⚡ **High Performance**: Bundled Rust tools (fd, ripgrep, bat) for fast file operations
- 🎨 **Theme Support**: Light and dark mode themes
- 📦 **Self-Contained**: All tools bundled - no installation required
- 📱 **Cross-Platform**: Runs on macOS, Windows, and Linux via Electron

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Backend**: Electron, Node.js
- **AI Integration**: Claude Code via Anthropic SDK
- **Performance**: Bundled Rust tools (fd, ripgrep, bat)
- **Build Tools**: Vite, Electron Builder

## Bundled Tools

Coworker includes high-performance Rust tools out of the box:

| Tool | Purpose |
|------|---------|
| fd | Fast file finding (10-50x faster than ls) |
| ripgrep | Blazing fast search |
| bat | Syntax-highlighted file viewing |

**No installation required!** All tools are bundled with the app.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd coworker

# Install dependencies
npm install

# Start development
npm run dev
```

### Building

```bash
# Build for production
npm run build

# Create distributable packages
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## Development

```bash
# Start React dev server
npm run dev:react

# Start Electron app
npm run dev:electron
```

## Project Structure

```
src/
├── electron/          # Electron main process
├── ui/               # React frontend
│   ├── components/   # React components
│   ├── store/        # Zustand state management
│   └── utils/        # Utility functions
└── types.d.ts        # TypeScript definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

