# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@10.6.1 --activate

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY backend/package.json ./backend/package.json
COPY backend/tsconfig.json ./backend/tsconfig.json

# Install dependencies for workspace
RUN pnpm install --frozen-lockfile

# Copy backend source code
COPY backend ./backend

# Build backend TypeScript
RUN pnpm --filter ./backend build

# Stage 2: Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN corepack enable && corepack prepare pnpm@10.6.1 --activate

# Copy root configs and package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built dist and drizzle files from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/drizzle ./backend/drizzle
COPY --from=builder /app/backend/drizzle.config.ts ./backend/drizzle.config.ts
COPY --from=builder /app/backend/openapi.yaml ./backend/openapi.yaml

EXPOSE 8080

WORKDIR /app/backend

CMD ["node", "dist/src/server.js"]
