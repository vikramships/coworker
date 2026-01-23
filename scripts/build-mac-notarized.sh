#!/bin/bash

# Build and notarize Coworker for macOS
# Usage: ./scripts/build-mac-notarized.sh

set -e

# Load environment variables from .env
if [ -f "../.env" ]; then
    set -a
    source ../.env
    set +a
fi

echo "🍎 Building Coworker with notarization..."

# Check credentials
if [ -z "$APPLE_ID" ] || [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ]; then
    echo "❌ Error: APPLE_ID and APPLE_APP_SPECIFIC_PASSWORD required in .env"
    exit 1
fi

echo "📋 Apple ID: $APPLE_ID"

# Set Team ID if not provided (should be in .env)
if [ -z "$APPLE_TEAM_ID" ]; then
    echo "❌ Error: APPLE_TEAM_ID required in .env"
    exit 1
fi
echo "📋 Team ID: $APPLE_TEAM_ID"

# Build and sign
echo "🔧 Building..."
cd ..
bun run transpile:electron && \
bun run build && \
bunx electron-builder --mac --arm64 --publish never

APP_PATH="dist/mac-arm64/Coworker.app"

# Verify signing
echo "🔏 Verifying signature..."
codesign --verify --verbose=2 "$APP_PATH"

# Zip for notarization
echo "📦 Creating ZIP for notarization..."
cd dist/mac-arm64
zip -ry "Coworker.app.zip" "Coworker.app"
cd ../..

# Submit for notarization using notarytool (Apple's recommended method)
echo "📤 Submitting to Apple for notarization..."
xcrun notarytool submit \
    "dist/mac-arm64/Coworker.app.zip" \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_APP_SPECIFIC_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    --wait \
    --output-format json

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "✅ Notarization APPROVED!"

    # Staple the ticket
    echo "📌 Stapling notarization ticket..."
    xcrun stapler staple "$APP_PATH"

    # Cleanup
    rm -f "dist/mac-arm64/Coworker.app.zip"

    echo ""
    echo "🎉 Build complete with notarization!"
    echo "📦 DMG: dist/Coworker-0.0.2-arm64.dmg"
    exit 0
else
    echo "❌ Notarization failed!"
    echo "Run 'xcrun notarytool log <submission-id> --apple-id $APPLE_ID --password $APPLE_APP_SPECIFIC_PASSWORD --team-id $APPLE_TEAM_ID' for details"
    exit 1
fi
