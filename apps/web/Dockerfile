FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

COPY apps/web/app ./app
COPY apps/web/middleware.ts ./middleware.ts
COPY apps/web/scripts ./scripts
COPY apps/web/src ./src
COPY apps/web/next-env.d.ts ./next-env.d.ts
COPY apps/web/next.config.mjs ./next.config.mjs
COPY apps/web/tsconfig.json ./tsconfig.json

ENV NODE_ENV=production
ENV NEXT_DIST_DIR=.next-build

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_DIST_DIR=.next-build

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/app ./app
COPY --from=build /app/src ./src
COPY --from=build /app/next-env.d.ts ./next-env.d.ts
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/.next-build ./.next-build

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
