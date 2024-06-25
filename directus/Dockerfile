FROM directus/directus:10.12.1

# COPY ./migrations/ ./migrations/
# COPY ./extensions/ ./extensions/

COPY ./snapshot-20240626.yaml ./snapshot.yaml

# https://github.com/directus/directus/blob/main/Dockerfile
CMD : \
    && node cli.js bootstrap \
    # load snapshot (just run it manually)
    # && npx directus schema apply --yes ./snapshot.yaml \
    && pm2-runtime start ecosystem.config.cjs \
    ;