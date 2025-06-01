FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache dumb-init

# Create user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Set ownership
RUN chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
