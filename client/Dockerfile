FROM node:18-alpine

WORKDIR /app

# Copy only the manifest files first
COPY package*.json ./

# Install deps
RUN npm install

# Then copy the rest of the app
COPY . .

# Build the app
RUN npm run build

# Install static server
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]