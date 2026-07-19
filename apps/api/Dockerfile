FROM node:22-slim

# Install Playwright system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 libatspi2.0-0 libwayland-client0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and Prisma schema first
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies (postinstall needs schema)
RUN npm install

# Copy rest of source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3001

# Start the app
CMD ["sh", "-c", "npm run build && node /tmp/dist/index.js"]
