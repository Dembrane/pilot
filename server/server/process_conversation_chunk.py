from logging import getLogger
from queue import Queue
import threading


from server.database import ConversationChunkModel, ResourceModel, db
from server.util import run_with_timeout
from openai import OpenAI

logger = getLogger("process_conversation_chunk")

client = OpenAI()


def process_conversation_chunk(
    chunk: ConversationChunkModel,
) -> ConversationChunkModel:
    path = chunk.path
    with open(path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            model="whisper-1", file=f, response_format="text"
        )

        logger.info(f"Transcription: {transcription}")

    chunk.transcript = str(transcription)
    chunk.is_processed = True
    db.add(chunk)
    db.commit()

    return chunk


class ProcessConversationChunkTaskQueueItem:
    logger = getLogger("ProcessConversationChunkTaskQueueItem")

    def __init__(
        self,
        chunk: ConversationChunkModel,
        retry_left: int = 3,
    ) -> None:
        self.chunk = chunk
        self.retry_left = retry_left

    def __call__(self) -> None:
        logger.info(f"Processing conversation chunk {self.chunk.id}")
        run_with_timeout(process_conversation_chunk, args=[self.chunk], timeout_sec=60)
        logger.info(f"Conversation chunk {self.chunk.id} processed successfully")


# should be a singleton
class ProcessConversationChunkTaskQueue(Queue):
    logger = getLogger("ProcessConversationChunkTaskQueue")

    def __init__(self, num_workers: int = 3) -> None:
        super().__init__()
        self.num_workers = num_workers
        for _ in range(num_workers):
            t = threading.Thread(target=self.worker)
            t.daemon = True
            t.start()

    def add_task(self, item: ProcessConversationChunkTaskQueueItem) -> None:  # noqa
        logger.info(f"Adding task conversation chunk {item.chunk.id}")
        self.put(item)

    def worker(self) -> None:
        while True:
            item: ProcessConversationChunkTaskQueueItem = self.get()
            self.logger.info(f"Conversation chunk {item.chunk.id} picked up by worker")
            try:
                item()
            except Exception as e:
                if item.retry_left == 0:
                    self.logger.error(f"Failed to process chunk")

                    db.query(ConversationChunkModel).filter(
                        ConversationChunkModel.id == item.chunk.id
                    ).update(
                        values={
                            "processing_error": "Failed to process resource (Server error)"
                        }
                    )

                    db.commit()

                else:
                    item.retry_left -= 1
                    self.logger.error(
                        f"Failed to process chunk (Retries Left = {item.retry_left}): {e}"
                    )
                    self.put(item)

            finally:
                self.task_done()


process_conversation_chunk_queue = ProcessConversationChunkTaskQueue(num_workers=6)


# init the queue with conversation chunks that are not processed
def seed_process_conversation_chunk_queue() -> None:
    chunks = (
        db.query(ConversationChunkModel)
        .filter(ConversationChunkModel.is_processed == False)
        .all()
    )
    logger.info(
        f"Seeding process conversation chunk queue with {len(chunks)} pending chunks"
    )
    for chunk in chunks:
        process_conversation_chunk_queue.add_task(
            ProcessConversationChunkTaskQueueItem(chunk=chunk)
        )


if __name__ == "__main__":
    pass
