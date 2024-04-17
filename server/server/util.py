import uuid
import time
import random
import threading
from typing import Generator

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


def run_with_timeout(func, args=(), kwargs={}, timeout_sec: int = 1000):  # type: ignore
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
