FROM directus/directus:10.12.1

COPY ./migrations/ ./migrations/
COPY ./extensions/ ./extensions/

COPY ./snapshot-20240625.yaml ./snapshot.yaml

RUN npx directus schema apply --yes ./snapshot.yaml

# https://github.com/directus/directus/blob/main/Dockerfile
CMD : \
    && node cli.js bootstrap \
    && pm2-runtime start ecosystem.config.cjs \
    ;