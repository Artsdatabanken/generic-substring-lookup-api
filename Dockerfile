FROM node:10 as dep

COPY package.json package-lock.json ./

RUN npm install --frozen-lockfile --no-cache --production

FROM node:10
WORKDIR /app
COPY --from=dep /node_modules ./node_modules
RUN groupadd -r --gid 1007 dockerrunner && useradd -r -g dockerrunner dockerrunner

EXPOSE 9876
ADD . .
USER dockerrunner
CMD [ "node", "--max_old_space_size=8192", "src/index.js", "--port", "9876", "--dataPath", "/data/" ]