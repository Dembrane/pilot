# Database migrations

Use Directus schema migrations to manage the database schema.

1. Update database directly through Directus admin interface.
1. Save Snapshot: `npx directus schema snapshot --yes ./snapshot.yaml`
1. Update in `./directus/Dockerfile` to use the new snapshot.

---

Outdated (using alembic for migrations)

1. Generate migrations (run this when you make changes to the models)

```
cd server
source .venv/bin/activate
alembic revision --autogenerate -m "message"
```

2. Apply migrations (run this when you want to apply the changes to the database)

```
cd server
source .venv/bin/activate
alembic upgrade head
```
