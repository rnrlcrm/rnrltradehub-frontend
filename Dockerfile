# -----------------------------
# Stage 1: Build the React app using Vite
# -----------------------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (for efficient caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the app for production
RUN npm run build

# -----------------------------
# Stage 2: Serve the built files using Nginx
# -----------------------------
FROM nginx:stable-alpine

# Copy the production build from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration (optional)
# Uncomment this line if you have nginx.conf
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
