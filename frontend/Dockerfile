FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3004

# Run the preview server
CMD ["npm", "run", "preview"]
