FROM node:20-alpine AS third-party-ext

RUN apk add python3 g++ make

WORKDIR /extensions

COPY extensions .

RUN npm install
# Move all extensions the starts with 'directus-extension-', using find, to the /extensions/directus folder
RUN mkdir -p ./directus

RUN cd node_modules && find . -maxdepth 1 -type d -name "directus-extension-*" -exec mv {} ../directus \;


FROM directus/directus:11.3.5

# for extensions installed via npm

COPY ./directus-sync.config.js ./directus-sync.config.js

COPY --from=third-party-ext /extensions/directus ./extensions
COPY ./templates ./templates/
COPY ./migrations/ ./migrations/

# https://github.com/directus/directus/blob/main/Dockerfile
CMD : \
    # this step also runs the migrations (before the snapshot is applied!)
    && node cli.js bootstrap \
    # Run this manually when you want to pull the latest changes from the database
    # && npx directus-sync push \
    && pm2-runtime start ecosystem.config.cjs \
    ;