FROM node:20-alpine

WORKDIR /app

RUN chown -R node:node /app

COPY --chown=node:node package*.json ./

USER node
ENV NODE_ENV=production

RUN npm install --omit=dev

COPY --chown=node:node . .

# Expose port
EXPOSE 3070

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3070/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

CMD ["node", "server.js"]