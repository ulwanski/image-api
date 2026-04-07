FROM node:24.14-alpine AS base
WORKDIR /app
COPY *.json ./
RUN npm ci

FROM base AS development
ENV NODE_ENV=development
COPY . .
CMD ["npm", "run", "start:dev"]

FROM base AS builder
ENV NODE_ENV=development
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main"]