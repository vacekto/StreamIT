# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build the NestJS app
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

# Expose default NestJS port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]