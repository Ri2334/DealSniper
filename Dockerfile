# Use the official Playwright image which includes all OS dependencies
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

# Copy root package.json if needed, but we focus on server
COPY package.json ./

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Install Chromium for the specific Playwright version in package.json
RUN npx playwright install chromium

# Copy the rest of the server code
COPY server/ .

# Verify Playwright installation (at least check if executable exists)
RUN npm run verify-playwright || (echo "Playwright Verification Failed during build" && exit 1)

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose port
EXPOSE 10000

# Start command
CMD ["node", "server.js"]
