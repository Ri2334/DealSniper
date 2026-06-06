FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install
RUN npx playwright install chromium

# Copy rest of the server code
COPY server/ .

# Expose port (Render uses PORT env var, but 10000 is default)
ENV PORT=10000
EXPOSE 10000

# Start command
CMD ["npm", "start"]
