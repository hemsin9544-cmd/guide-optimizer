FROM node:22-slim

WORKDIR /app

# Install system dependencies required by Playwright's Chromium
RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Install Playwright's Chromium browser binary
RUN npx playwright install chromium

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
