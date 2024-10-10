# Useful Database Commands

## Taking a snapshot of the database (`pg_dump`)

1. ssh into the server

2. psql shell commands
   replace `b70af5a57674` with the container id of the postgres container

```bash

docker exec -it b70af5a57674 /bin/sh

# in the container
pg_dump -U dembrane dembrane > 20240731.sql
exit

docker cp b70af5a57674:20240731.sql ./
```

3. copy to your local machine if needed using sftp/scp

## Restore a snapshot of the database (`pg_restore`)

```bash
# in the pgvector container after copying the file to the container
createdb -U dembrane dembrane
psql -U dembrane -d dembrane -f 20240731.sql
exit
```

## Run Directus migrations (on the directus container)

1. delete `directus_*` tables if u need a fresh install
2. `npx directus bootstrap`
3. `npx directus schema apply snapshot.yaml`
4. import roles from `schema.json` using the directus admin panel: Schema Management Module
