# Step 1: Build the React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy only package.json first (no package-lock.json yet)
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React app
RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config (must listen on 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to Nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
