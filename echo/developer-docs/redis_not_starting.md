# Redis not starting

if the redis container is not starting because of something like

```
Can't open the append-only file: Permission denied
```

do this in your **local** terminal (outside of the devcontainer)

```bash
sudo chown -R 1001:1001 .devcontainer/redis_data
```
