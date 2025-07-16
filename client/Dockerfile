# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy full app code first (including package.json, just in case)
COPY . .

# Install dependencies
RUN npm install

# Build the app
RUN npm run build

# Install 'serve' for static hosting
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start using 'serve'
CMD ["serve", "-s", "build", "-l", "3000"]