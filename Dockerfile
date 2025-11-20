FROM node:20-bullseye-slim

# create non-root user for safety
RUN groupadd -r appgroup && useradd -r -g appgroup -m arbaz

WORKDIR /usr/src/app

# copy package files first for caching
COPY package*.json .


# install all dependencies (dev + prod) required for build
RUN npm install --verbose

# copy source files
COPY . .

# ensure server tsconfig exists (you already created it)
# run the build (vite + tsc). This must produce dist/server/index.js
RUN npm run build

RUN ls -R dist

# make sure files are accessible by non-root user
RUN chown -R arbaz:appgroup /usr/src/app

# switch to non-root user
USER arbaz

# expose port
ENV NODE_ENV=production
ENV PORT=9005
EXPOSE 9005

# start the compiled server (adjust path if your entry is different)
CMD ["node", "./dist/server/index.js"]
