FROM node:18-alpine

WORKDIR /app

# Copy only the manifest files first
COPY package*.json ./

# Install deps
RUN npm install

# Then copy the rest of the app
COPY . .

# Expose port
EXPOSE 3002

# Set environment variables for React dev server
ENV HOST=0.0.0.0
ENV PORT=3002

# Run development server with hot reloading
CMD ["npm", "start"]