FROM node:22-slim AS base
WORKDIR /app
ENV HOME=/app
COPY package.json ./
RUN apt-get update -y && apt-get install -y --no-install-recommends build-essential python3 openssl && rm -rf /var/lib/apt/lists/*

FROM base AS deps
RUN npm install --ignore-scripts

FROM base AS swisseph
COPY --from=deps /app/node_modules ./node_modules
RUN cd node_modules/@swisseph/node && node scripts/setup-libswe.js && npx node-gyp rebuild

FROM node:22-slim AS build
WORKDIR /app
ENV HOME=/app
COPY --from=swisseph /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --ignore-scripts

FROM node:22-slim
WORKDIR /app
ENV HOME=/app
RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=build /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@swisseph/node ./node_modules/@swisseph/node
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/modules/notification/templates ./dist/src/modules/notification/templates

RUN chown -R app:app /app/node_modules/@prisma /app/node_modules/.prisma && chown -R app:app /app
RUN mkdir -p /storage/media && chown -R app:app /storage

USER app
EXPOSE 4000
ENV NODE_ENV=production
CMD sh -c "ok=0; for i in 1 2 3 4 5; do npx prisma migrate deploy && { ok=1; break; }; echo 'Migration attempt '$i'/5 failed, retrying...'; sleep 3; done; [ $ok -eq 1 ] && exec node dist/src/server.js || { echo 'Migration failed after 5 attempts'; exit 1; }"
