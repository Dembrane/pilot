from logging import getLogger
from queue import Queue
from threading import Thread
import threading

# rudimentary implementation
class TaskQueue(Queue):
    logger = getLogger("TaskQueue")
    num_workers: int

    def __init__(self, num_workers=1):
        Queue.__init__(self)
        self.num_workers = num_workers
        # immediately start workers
        self.logger.info(f"Starting {num_workers} workers")
        self.start_workers()

    def add_task(self, task, *args, **kwargs):
        args = args or ()
        kwargs = kwargs or {}
        self.put((task, args, kwargs))

    def start_workers(self):
        for _ in range(self.num_workers):
            t = Thread(target=self.worker)
            t.daemon = True
            t.start()

    def worker(self):
        while True:
            tupl = self.get()
            item, args, kwargs = tupl
            item(*args, **kwargs)
            self.task_done()

def run_with_timeout(func, args=(), kwargs={}, timeout=60):
    def timeout_handler():
        raise TimeoutError("Function execution timed out")
    
    timer = threading.Timer(timeout, timeout_handler)
    timer.start()

    try:
        result = func(*args, **kwargs)
        timer.cancel()
        return result
    except Exception as e:
        timer.cancel()
        raise e
