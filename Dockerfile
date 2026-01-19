# Dockerfile - Local Development
# Single-stage development image with hot reload

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies (including dev)
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start development server with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
