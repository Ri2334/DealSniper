#!/usr/bin/env bash
# Build Script for Render

echo "--- [BUILD_DIAGNOSTICS_START] ---"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "PLAYWRIGHT_BROWSERS_PATH: $PLAYWRIGHT_BROWSERS_PATH"

# Install dependencies
echo "Installing root dependencies..."
npm install

echo "Installing server dependencies..."
cd server && npm install

# Install Playwright Chromium
echo "Installing Playwright Chromium..."
npx playwright install chromium

# Post-install diagnostics
echo "Executable Path: $(node -e 'console.log(require("playwright").chromium.executablePath())')"
echo "Listing ms-playwright cache..."
ls -R /opt/render/.cache/ms-playwright 2>/dev/null || echo "Cache directory not found."

echo "Listing local-browsers if exists..."
ls -R node_modules/playwright-core/.local-browsers 2>/dev/null || echo "Local browsers not found."

echo "--- [BUILD_DIAGNOSTICS_END] ---"
