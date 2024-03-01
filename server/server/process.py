from logging import getLogger
from queue import Queue
import threading

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter

from server.models import DocumentModel, SessionModel, db
from server.chains import load_title_chain, load_summary_chain
from server.config import FAISS_INDEX_PATH
from server.vectorstore import vectorstore

logger = getLogger("process")

lc_text_splitter = CharacterTextSplitter(
    separator="\n\n",
    chunk_size=33000,
    chunk_overlap=100,
    length_function=len,
    is_separator_regex=False,
)


class EmptyDocumentException(Exception):
    pass


# Mutates the document
# sets is_processed to True
# adds title and description
# adds to vectorstore
def process_document(document: DocumentModel) -> DocumentModel:
    session = document.session
    language = session.language

    if document is None:
        logger.info("Document is None")
        return None

    if document.is_processed == True:
        logger.info(f"Document {document.id} is already processed")
        return document

    lc_loader = PyPDFLoader(document.path)

    # runs the loader and splitter
    lc_documents = lc_loader.load_and_split(lc_text_splitter)

    logger.info(f"Loaded {len(lc_documents)} pages from {document.path}")

    if len(lc_documents) == 0:
        raise EmptyDocumentException

    first = lc_documents[0]
    mid = lc_documents[len(lc_documents) // 2]
    last = lc_documents[-1]

    # summarize
    lc_summarize_chain = load_summary_chain(language=language)
    summary_result = lc_summarize_chain.invoke({"documents": [first, mid, last]}).get(
        "output_text"
    )

    # get title
    lc_title_chain = load_title_chain(language=language)
    title = lc_title_chain.invoke({"text": summary_result})

    # add metadata
    for lc_doc in lc_documents:
        lc_doc.metadata["session_id"] = session.id
        lc_doc.metadata["document_id"] = document.id
        lc_doc.metadata["document_title"] = title
        lc_doc.metadata["document_summary"] = summary_result

    # embed and add to vectorstore
    vectorstore.add_documents(lc_documents)
    vectorstore.save_local(FAISS_INDEX_PATH)

    document.title = title
    document.description = summary_result
    document.is_processed = True

    db.add(document)
    db.commit()

    return document


def run_with_timeout(func, args=(), kwargs={}, timeout_sec: int = 60):  # type: ignore
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


def process_document_with_timeout(
    document: DocumentModel, timeout_sec: int
) -> DocumentModel:
    return run_with_timeout(process_document, args=[document], timeout_sec=timeout_sec)


class ProcessDocumentTaskQueueItem:
    logger = getLogger("ProcessDocumentTaskQueueItem")

    def __init__(
        self,
        document: DocumentModel,
        retry_left: int = 3,
    ) -> None:
        self.document = document
        self.retry_left = retry_left

    def __call__(self) -> None:
        logger.info(f"Processing document {self.document.id}")
        process_document_with_timeout(self.document, 60)
        logger.info(f"Document {self.document.id} processed successfully")


# should be a singleton
class ProcessDocumentTaskQueue(Queue):
    logger = getLogger("ProcessDocumentTaskQueue")

    def __init__(self, num_workers: int = 1) -> None:
        super().__init__()
        self.num_workers = num_workers
        for _ in range(num_workers):
            t = threading.Thread(target=self.worker)
            t.daemon = True
            t.start()

    def add_task(self, item: ProcessDocumentTaskQueueItem) -> None:  # noqa
        logger.info(f"Adding task for document {item.document.id}")
        self.put(item)

    def worker(self) -> None:
        while True:
            item: ProcessDocumentTaskQueueItem = self.get()
            self.logger.info(f"Document {item.document.id} picked up by worker")
            try:
                item()
            except Exception as e:
                if isinstance(e, EmptyDocumentException):
                    self.logger.error(f"Document {item.document.id} is empty")
                    item.document.processing_error = (
                        "Unable to read text from the document"
                    )
                    filename = item.document.path.split("/")[-1]
                    db.query(DocumentModel).filter(
                        DocumentModel.id == item.document.id
                    ).update(
                        values={
                            "processing_error": f"Unable to read text from the document: {filename}"
                        }
                    )
                    db.commit()

                elif item.retry_left == 0:
                    self.logger.error(
                        f"Failed to process document {item.document.id} after retries"
                    )
                    item.document.processing_error = "Failed to process document"
                    db.query(DocumentModel).filter(
                        DocumentModel.id == item.document.id
                    ).update(values={"processing_error": "Failed to process document"})
                    db.commit()

                else:
                    self.logger.error(f"Failed to process document: {e}")
                    item.retry_left -= 1
                    self.put(item)
            finally:
                self.task_done()


process_document_queue = ProcessDocumentTaskQueue(num_workers=3)


# init the queue with documents that don't have title and desc
def seed_process_document_queue() -> None:
    documents = (
        db.query(DocumentModel)
        .filter(DocumentModel.is_processed == 0)
        .filter(DocumentModel.processing_error == None)
        .all()
    )
    logger.info(
        f"Seeding process document queue with {len(documents)} pending documents"
    )
    for document in documents:
        process_document_queue.add_task(ProcessDocumentTaskQueueItem(document=document))


if __name__ == "__main__":
    pass
