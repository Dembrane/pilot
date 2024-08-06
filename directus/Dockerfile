FROM directus/directus:10.13.1

# COPY ./migrations/ ./migrations/
# COPY ./extensions/ ./extensions/
COPY ./templates ./templates/

COPY ./snapshots/snapshot.yaml ./snapshot.yaml

# https://github.com/directus/directus/blob/main/Dockerfile
CMD : \
    && node cli.js bootstrap \
    # load snapshot (just run it manually)
    # && npx directus schema apply --yes ./snapshot.yaml \
    && pm2-runtime start ecosystem.config.cjs \
    ;