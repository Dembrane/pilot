from logging import getLogger

from langchain_openai import ChatOpenAI

from server.models import DocumentModel, db
from server.chains import load_title_chain
from server.config import FAISS_INDEX_PATH
from server.task_queue import TaskQueue, run_with_timeout
from server.vectorstore import vectorstore
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains.summarize import load_summarize_chain

logger = getLogger("process")

lc_text_splitter = CharacterTextSplitter(
    separator="\n\n",
    chunk_size=900,
    chunk_overlap=100,
    length_function=len,
    is_separator_regex=False,
)

lc_llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo-1106")
lc_summarize_chain = load_summarize_chain(lc_llm, chain_type="map_reduce", input_key="documents", output_key="output_text")
lc_title_chain = load_title_chain()

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

    # embed and add to vectorstore
    vectorstore.add_documents(lc_documents)
    vectorstore.save_local(FAISS_INDEX_PATH)

    # summarize
    summary_result = lc_summarize_chain.invoke({"documents": lc_documents}).get("output_text")

    # get title
    title = lc_title_chain.invoke({"text": summary_result})

    document.title = title
    document.description = summary_result
    document.is_processed = True

    db.add(document)
    db.commit()

    return document 

def process_document_with_timeout(document: DocumentModel, timeout=60):
    return run_with_timeout(process_document,args=[document], timeout=timeout)

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
        self.put(item)
    
    def worker(self):
        while True:
            item: ProcessDocumentTaskQueueItem = self.get()
            try:
                item()
            except Exception as e:
                if item.retry_left <= 0:
                    self.logger.error(f"Failed to process document {item.document.id} after retries")
                    item.document.processing_error = f"Failed to process document after retries: {e}"
                    db.add(item.document)
                    db.commit()
                    self.task_done()
                    return

                logger.error(f"Failed to process document: {e}")
                item.retry_left -= 1
                self.put(item)

            self.task_done()

process_document_queue = ProcessDocumentTaskQueue(num_workers=2)

# init the queue with documents that don't have title and desc
def seed_process_document_queue():
    documents = db.query(DocumentModel).filter(DocumentModel.is_processed == 0).all()
    logger.info(f"Seeding process document queue with {len(documents)} pending documents")
    for document in documents:
        process_document_queue.add_task(ProcessDocumentTaskQueueItem(document))

if __name__ == "__main__":
    document = db.query(DocumentModel).filter(DocumentModel.id == "f7ec5e10-ecc6-418d-a851-a9a2a6fcdc11").first()
    process_document(document)