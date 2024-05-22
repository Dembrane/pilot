# Database migrations

1. Generate migrations (run this when you make changes to the models)

```
cd server
alembic revision --autogenerate -m "message"
```

2. Apply migrations (run this when you want to apply the changes to the database)

```
cd server
alembic upgrade head
```
