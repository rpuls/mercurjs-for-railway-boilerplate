FROM node:20-bookworm-slim AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-bookworm-slim
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY --from=build /app/.medusa ./.medusa
COPY --from=build /app/medusa-config.ts /app/tsconfig.json ./
COPY --from=build /app/src ./src
EXPOSE 9000
CMD ["pnpm", "start"]
