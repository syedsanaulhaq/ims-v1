# Use Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3001
EXPOSE 4173

# Create startup script
RUN echo '#!/bin/sh\nnpm run prod:start' > start.sh && chmod +x start.sh

# Start the application
CMD ["./start.sh"]
