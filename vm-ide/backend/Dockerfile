FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma@^6.19.2 generate
COPY backend/ .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN mkdir -p /app/logs && chown backend:nodejs /app/logs

USER backend
EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/server.js"]
