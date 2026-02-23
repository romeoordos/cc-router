# Build stage
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-alpine
WORKDIR /app

ENV NODE_ENV=production PORT=3010

COPY --from=builder /app/dist ./dist
# tiktoken loads tiktoken_bg.wasm via fs.readFileSync at runtime — cannot be bundled
COPY --from=builder /app/node_modules/tiktoken ./node_modules/tiktoken

RUN apk add --no-cache curl && mkdir -p /root/.claude

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3010}/health || exit 1

CMD ["bun", "run", "dist/cli.js", "--no-tui"]
