from logging import getLogger
import os
from queue import Queue
import subprocess
import threading


from server.database import ConversationChunkModel, ConversationModel, db
from server.util import run_with_timeout
from openai import OpenAI

logger = getLogger("process_conversation_chunk")

client = OpenAI()


def convert_mp4_to_mp3(input_file: str, output_file: str) -> bool:
    command = [
        "ffmpeg",
        "-i",
        input_file,
        "-vn",
        "-ab",
        "128k",
        "-ar",
        "44100",
        "-y",
        output_file,
    ]

    try:
        result = subprocess.run(command, check=True)
    except subprocess.CalledProcessError as e:
        logger.error(e)
        return False
    except FileNotFoundError:
        logger.error("FFmpeg is not installed or not found in the system path.")
        return False

    # Check if the conversion was successful
    if result.returncode == 0:
        logger.info("Conversion successful.")
        return True
    else:
        logger.info(f"Conversion failed with return code {result.returncode}.")
        return False


def process_conversation_chunk(
    chunk: ConversationChunkModel,
) -> ConversationChunkModel:
    path = chunk.path

    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")

    if path.endswith(".mp4"):
        output_path = path.replace(".mp4", ".mp3")
        logger.info(f"Converting to mp3: {output_path}")
        if convert_mp4_to_mp3(path, output_path):
            logger.info(f"Converted to mp3: {output_path}")
            chunk.path = output_path
            path = output_path
            db.add(chunk)
            db.commit()

    # https://cookbook.openai.com/examples/whisper_prompting_guide
    prompt = ""
    conversation = (
        db.query(ConversationModel)
        .filter(ConversationModel.id == chunk.conversation_id)
        .first()
    )
    if conversation is not None and conversation.context is not None:
        prompt = conversation.context

    logger.info(f"using prompt: {prompt}")

    with open(path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            model="whisper-1", file=f, response_format="text", prompt=prompt
        )

        logger.info(f"Transcription: {transcription}")

    chunk.transcript = str(transcription)
    chunk.is_processed = True
    chunk.processing_error = None
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
            except FileNotFoundError as e:
                self.logger.error(f"Failed to process chunk: {e}")

                db.query(ConversationChunkModel).filter(
                    ConversationChunkModel.id == item.chunk.id
                ).update(
                    values={
                        "processing_error": "Failed to process resource (File not found)"
                    }
                )

                db.commit()
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
