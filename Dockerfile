FROM node:22-slim

# better-sqlite3 needs build tools for native addon
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts && npm rebuild better-sqlite3

COPY dist/ ./dist/

ENV NODE_ENV=production

ENTRYPOINT ["node", "/app/dist/cli/index.js"]
CMD ["--help"]
