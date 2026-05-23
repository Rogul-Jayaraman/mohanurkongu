FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm ci --only=production

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup --system app && adduser --system -G app app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

USER app
EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
