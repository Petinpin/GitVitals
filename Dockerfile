# Dockerfile - Local Development
# Single-stage development image with hot reload

FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma files
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Clear any cached prisma clients and generate fresh
RUN rm -rf node_modules/.prisma && rm -rf node_modules/@prisma/client && npx prisma generate

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]
