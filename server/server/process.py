from logging import getLogger

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter

from server.models import DocumentModel, db
from server.chains import load_title_chain, load_summary_chain
from server.config import FAISS_INDEX_PATH
from server.task_queue import TaskQueue, run_with_timeout
from server.vectorstore import vectorstore

logger = getLogger("process")

lc_text_splitter = CharacterTextSplitter(
    separator="\n\n",
    chunk_size=900,
    chunk_overlap=100,
    length_function=len,
    is_separator_regex=False,
)

lc_summarize_chain = load_summary_chain()
lc_title_chain = load_title_chain()


class EmptyDocumentException(Exception):
    pass


# Mutates the document
# sets is_processed to True
# adds title and description
# adds to vectorstore
def process_document(document: DocumentModel):
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

    # summarize
    summary_result = lc_summarize_chain.invoke({"documents": lc_documents}).get(
        "output_text"
    )

    # get title
    title = lc_title_chain.invoke({"text": summary_result})

    # add metadata
    for lc_doc in lc_documents:
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


def process_document_with_timeout(document: DocumentModel, timeout=60):
    return run_with_timeout(process_document, args=[document], timeout=timeout)


class ProcessDocumentTaskQueueItem:
    logger = getLogger("ProcessDocumentTaskQueueItem")

    def __init__(self, document: DocumentModel, retry_left=3):
        self.document = document
        self.retry_left = retry_left

    def __call__(self):
        logger.info(f"Processing document {self.document.id}")
        process_document_with_timeout(self.document)
        logger.info(f"Document {self.document.id} processed successfully")


# should be a singleton
class ProcessDocumentTaskQueue(TaskQueue):
    logger = getLogger("ProcessDocumentTaskQueue")

    def add_task(self, item: ProcessDocumentTaskQueueItem):
        logger.info(f"Adding task for document {item.document.id}")
        self.put(item)

    def worker(self):
        while True:
            item: ProcessDocumentTaskQueueItem = self.get()
            logger.info(f"Document {item.document.id} picked up by worker")
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
                    self.task_done()
                    return

                if item.retry_left <= 0:
                    self.logger.error(
                        f"Failed to process document {item.document.id} after retries"
                    )
                    item.document.processing_error = "Failed to process document"
                    db.query(DocumentModel).filter(
                        DocumentModel.id == item.document.id
                    ).update(values={"processing_error": "Failed to process document"})
                    db.commit()
                    self.task_done()
                    return

                logger.error(f"Failed to process document: {e}")
                item.retry_left -= 1
                self.put(item)

            self.task_done()
            return


process_document_queue = ProcessDocumentTaskQueue(num_workers=5)


# init the queue with documents that don't have title and desc
def seed_process_document_queue():
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
        process_document_queue.add_task(ProcessDocumentTaskQueueItem(document))


if __name__ == "__main__":
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == "f7ec5e10-ecc6-418d-a851-a9a2a6fcdc11")
        .first()
    )
    process_document(document)
