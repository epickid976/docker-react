# Multi-stage Dockerfile for full-stack application
FROM node:18-alpine AS client-builder

# Build the React client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dependencies for both client and server
WORKDIR /app

# Copy server files and install dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./

# Copy built client files
COPY --from=client-builder /app/client/build ./public

# Create a startup script that runs both services
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "Starting server..."' >> start.sh && \
    echo 'node index.js &' >> start.sh && \
    echo 'SERVER_PID=$!' >> start.sh && \
    echo 'echo "Starting static file server..."' >> start.sh && \
    echo 'npx serve -s public -l 3000 &' >> start.sh && \
    echo 'CLIENT_PID=$!' >> start.sh && \
    echo 'echo "Both services started"' >> start.sh && \
    echo 'wait $SERVER_PID $CLIENT_PID' >> start.sh && \
    chmod +x start.sh

# Install serve for static file serving
RUN npm install -g serve

# Expose both ports
EXPOSE 3000 5000

# Start both services
CMD ["./start.sh"]
