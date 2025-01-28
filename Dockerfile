FROM node:18-alpine
ENV NODE_ENV production
WORKDIR /app
COPY . .
RUN chown node:node ./ -R
USER node
RUN npm install
RUN npm install vite
RUN npx vite build --base=/
EXPOSE 3000
CMD node server.cjs