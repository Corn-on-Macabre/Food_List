FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY index.js mcp.js data.js auth.js ./
EXPOSE 3001
CMD ["node", "index.js"]
