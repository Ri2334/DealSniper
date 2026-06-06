#!/usr/bin/env bash
# Build Script for Render (Aggressive Diagnostics)

set -e # Exit on any error

echo "--- [BUILD_DIAGNOSTICS_START] ---"
echo "Current User: $(whoami)"
echo "Home Directory: $HOME"
echo "Current directory: $(pwd)"
echo "PLAYWRIGHT_BROWSERS_PATH: $PLAYWRIGHT_BROWSERS_PATH"

# Install dependencies
echo "Installing root dependencies..."
npm install

echo "Installing server dependencies..."
cd server
npm install

# Install Playwright Chromium
echo "Installing Playwright Chromium..."
npx playwright --version
npx playwright install chromium
npx playwright install --list

# Verify installation locations
echo "--- [VERIFYING INSTALLATION] ---"
EXE_PATH=$(node -e 'try { console.log(require("playwright").chromium.executablePath()) } catch(e) { console.log("ERROR") }')
echo "Expected Executable Path: $EXE_PATH"

if [ "$EXE_PATH" = "ERROR" ]; then
    echo "CRITICAL: Could not determine executable path via Node."
    exit 1
fi

# Print contents of key directories
echo "Listing node_modules/playwright-core:"
ls -F node_modules/playwright-core 2>/dev/null || echo "Not found"

echo "Listing node_modules/playwright/.local-browsers:"
ls -R node_modules/playwright/.local-browsers 2>/dev/null || echo "Not found"

echo "Listing /opt/render/.cache/ms-playwright:"
ls -R /opt/render/.cache/ms-playwright 2>/dev/null || echo "Not found"

# Check if executable exists
if [ -f "$EXE_PATH" ]; then
    echo "SUCCESS: Chromium executable found at $EXE_PATH"
else
    echo "FAILURE: Chromium executable NOT FOUND at $EXE_PATH"
    # Attempt to find it manually
    echo "Searching for chrome executable..."
    find . -name "chrome" -type f
    find /opt/render -name "chrome" -type f 2>/dev/null || true
    
    echo "CRITICAL: Playwright installation failed to produce a valid executable."
    exit 1
fi

echo "--- [BUILD_DIAGNOSTICS_END] ---"
cd ..
