# server/Dockerfile

# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files explicitly from build context
COPY ./package.json ./package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server files
COPY . .

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]