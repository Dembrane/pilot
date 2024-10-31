FROM directus/directus:10.13.3

# COPY ./extensions/ ./extensions/
COPY ./migrations/ ./migrations/
COPY ./templates ./templates/

COPY ./snapshots/snapshot.yaml ./snapshot.yaml

# https://github.com/directus/directus/blob/main/Dockerfile
CMD : \
    && node cli.js bootstrap \
    && npx directus schema apply --yes ./snapshot.yaml \
    && pm2-runtime start ecosystem.config.cjs \
    ;