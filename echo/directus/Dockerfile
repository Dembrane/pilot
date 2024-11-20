FROM node:20-alpine AS third-party-ext

RUN apk add python3 g++ make

WORKDIR /extensions

COPY extensions .

RUN npm install
# Move all extensions the starts with 'directus-extension-', using find, to the /extensions/directus folder
RUN mkdir -p ./directus

RUN cd node_modules && find . -maxdepth 1 -type d -name "directus-extension-*" -exec mv {} ../directus \;


FROM directus/directus:10.13.3

# for extensions installed via npm
COPY --from=third-party-ext /extensions/directus ./extensions
COPY ./templates ./templates/
COPY ./migrations/ ./migrations/
COPY ./snapshots/snapshot.yaml ./snapshot.yaml

# https://github.com/directus/directus/blob/main/Dockerfile
CMD : \
    # this step also runs the migrations (before the snapshot is applied!)
    && node cli.js bootstrap \
    && npx directus schema apply --yes ./snapshot.yaml \
    && pm2-runtime start ecosystem.config.cjs \
    ;