#!/bin/bash
# Download pre-built Rust tool binaries for bundling in Electron app

set -e

PLATFORM=$(uname -s)
ARCH=$(uname -m)
BIN_DIR="$(pwd)/bin"

# Create bin directory
mkdir -p "$BIN_DIR"

echo "Downloading binaries for $PLATFORM-$ARCH..."

# fd - File finder
echo "  Downloading fd..."
case "$PLATFORM-$ARCH" in
    Darwin-x86_64)
        curl -sL "https://github.com/sharkdp/fd/releases/download/v9.1.0/fd-v9.1.0-x86_64-apple-darwin.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "fd-v9.1.0-x86_64-apple-darwin/fd"
        ;;
    Darwin-arm64)
        curl -sL "https://github.com/sharkdp/fd/releases/download/v9.1.0/fd-v9.1.0-aarch64-apple-darwin.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "fd-v9.1.0-aarch64-apple-darwin/fd"
        ;;
    Linux-x86_64)
        curl -sL "https://github.com/sharkdp/fd/releases/download/v9.1.0/fd-v9.1.0-x86_64-unknown-linux-gnu.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "fd-v9.1.0-x86_64-unknown-linux-gnu/fd"
        ;;
    Linux-aarch64)
        curl -sL "https://github.com/sharkdp/fd/releases/download/v9.1.0/fd-v9.1.0-aarch64-unknown-linux-gnu.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "fd-v9.1.0-aarch64-unknown-linux-gnu/fd"
        ;;
esac

# ripgrep - Search
echo "  Downloading ripgrep..."
case "$PLATFORM-$ARCH" in
    Darwin-x86_64)
        curl -sL "https://github.com/BurntSushi/ripgrep/releases/download/14.1.0/ripgrep-14.1.0-x86_64-apple-darwin.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "ripgrep-14.1.0-x86_64-apple-darwin/rg"
        ;;
    Darwin-arm64)
        curl -sL "https://github.com/BurntSushi/ripgrep/releases/download/14.1.0/ripgrep-14.1.0-aarch64-apple-darwin.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "ripgrep-14.1.0-aarch64-apple-darwin/rg"
        ;;
    Linux-x86_64)
        curl -sL "https://github.com/BurntSushi/ripgrep/releases/download/14.1.0/ripgrep-14.1.0-x86_64-unknown-linux-gnu.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "ripgrep-14.1.0-x86_64-unknown-linux-gnu/rg"
        ;;
    Linux-aarch64)
        curl -sL "https://github.com/BurntSushi/ripgrep/releases/download/14.1.0/ripgrep-14.1.0-aarch64-unknown-linux-gnu.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "ripgrep-14.1.0-aarch64-unknown-linux-gnu/rg"
        ;;
esac

# bat - Syntax cat
echo "  Downloading bat..."
case "$PLATFORM-$ARCH" in
    Darwin-x86_64)
        curl -sL "https://github.com/sharkdp/bat/releases/download/v25.1.0/bat-v25.1.0-x86_64-apple-darwin.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "bat-v25.1.0-x86_64-apple-darwin/bat"
        ;;
    Darwin-arm64)
        curl -sL "https://github.com/sharkdp/bat/releases/download/v25.1.0/bat-v25.1.0-aarch64-apple-darwin.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "bat-v25.1.0-aarch64-apple-darwin/bat"
        ;;
    Linux-x86_64)
        curl -sL "https://github.com/sharkdp/bat/releases/download/v25.1.0/bat-v25.1.0-x86_64-unknown-linux-gnu.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "bat-v25.1.0-x86_64-unknown-linux-gnu/bat"
        ;;
    Linux-aarch64)
        curl -sL "https://github.com/sharkdp/bat/releases/download/v25.1.0/bat-v25.1.0-aarch64-unknown-linux-gnu.tar.gz" | tar xz -C "$BIN_DIR" --strip-components=1 "bat-v25.1.0-aarch64-unknown-linux-gnu/bat"
        ;;
esac

# Make binaries executable
chmod +x "$BIN_DIR"/*

echo "✅ Binaries downloaded to $BIN_DIR/"
ls -la "$BIN_DIR"/
