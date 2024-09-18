import time
import uuid
import random
import asyncio
import logging
import threading
from os import path
from typing import Any, Dict, Tuple, Optional, Generator
from datetime import datetime, timezone

import requests

from dembrane.config import IMAGES_DIR, API_BASE_URL

random.seed(time.time())


def generate_uuid() -> str:
    return str(uuid.uuid4())


def generate_4_digit_pin() -> str:
    return str(random.randint(1000, 9999))[:4]


def generate_6_digit_pin() -> str:
    return str(random.randint(100000, 999999))[:6]


def iter_file_content(file_path: str) -> Generator[bytes, None, None]:
    with open(file_path, mode="rb") as file_like:
        yield from file_like


def download_image_and_get_public_url(image_url: str) -> str:
    response = requests.get(image_url)
    response.raise_for_status()

    extension = image_url.split("?")[0].split(".")[-1]
    image_name = f"{generate_uuid()}.{extension}"

    to_save_path = path.join(IMAGES_DIR, image_name)

    with open(to_save_path, "wb") as file:
        file.write(response.content)

    return API_BASE_URL + "/api/static/image/" + image_name


def run_with_timeout(func, args=(), kwargs=None, timeout_sec: int = 1000):  # type: ignore
    if kwargs is None:
        kwargs = {}

    def timeout_handler() -> None:
        raise TimeoutError("Function execution timed out")

    timer = threading.Timer(timeout_sec, timeout_handler)
    timer.start()

    try:
        result = func(*args, **kwargs)  # noqa
        timer.cancel()
        return result
    except Exception as e:
        timer.cancel()
        raise e


def get_utc_timestamp() -> datetime:
    return datetime.now(tz=timezone.utc)


def get_safe_filename(filename: str) -> str:
    return filename.replace("/", "_").replace("\\", "_").replace(" ", "_")


logger = logging.getLogger(__name__)


class CacheWithExpiration:
    def __init__(self, ttl: int):
        self.cache: Dict[str, Tuple[Any, float]] = {}
        self.ttl = ttl
        self.lock = asyncio.Lock()
        logger.debug(f"Initialized CacheWithExpiration with TTL: {ttl}")

    async def get(self, key: str) -> Optional[Any]:
        async with self.lock:
            if key in self.cache:
                value, expiration_time = self.cache[key]
                if time.time() < expiration_time:
                    logger.debug(f"Cache hit for key: {key}")
                    return value
                else:
                    logger.debug(f"Cache expired for key: {key}")
                    del self.cache[key]
            else:
                logger.debug(f"Cache miss for key: {key}")
        return None

    async def set(self, key: str, value: Any) -> None:
        expiration_time = time.time() + self.ttl
        async with self.lock:
            self.cache[key] = (value, expiration_time)
        logger.debug(f"Set cache for key: {key}, expires at: {expiration_time}")
        asyncio.create_task(self.expire_cache(key, expiration_time))

    async def expire_cache(self, key: str, expiration_time: float) -> None:
        await asyncio.sleep(self.ttl)
        async with self.lock:
            stored_value = self.cache.get(key)
            if stored_value and stored_value[1] <= expiration_time:
                del self.cache[key]
                logger.debug(f"Expired and removed cache for key: {key}")

    async def clear(self) -> None:
        async with self.lock:
            self.cache.clear()
            logger.debug("Cleared entire cache")


if __name__ == "__main__":
    print(
        download_image_and_get_public_url(
            "https://oaidalleapiprodscus.blob.core.windows.net/private/org-Hlxgir8XyuK0fxq0h5KE1Xb4/user-vs2eMr6Wg0KwioZgd1VupzGS/img-j8vo82eATvEqdZjSxd4iPpTU.png?st=2024-06-21T05%3A56%3A44Z&se=2024-06-21T07%3A56%3A44Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-06-20T23%3A40%3A21Z&ske=2024-06-21T23%3A40%3A21Z&sks=b&skv=2023-11-03&sig=S/AtHlhTA9dVE18h9pKexQhN/1UKrGqqHwsM6hpE8/M%3D"
        )
    )
