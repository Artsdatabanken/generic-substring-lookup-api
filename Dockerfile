FROM node:10 as dep

COPY package.json package-lock.json ./

RUN npm install --frozen-lockfile --no-cache --production

FROM node:10
WORKDIR /app
COPY --from=dep /node_modules ./node_modules
EXPOSE 9876
ADD . .
CMD [ "node", "src/index.js", "--port", "9876", "--dataPath", "/data/" ]