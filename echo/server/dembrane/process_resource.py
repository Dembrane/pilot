# from logging import getLogger
# from queue import Queue
# import threading

# from langchain_community.document_loaders import PyPDFLoader
# from langchain.text_splitter import CharacterTextSplitter

# from dembrane.database import ResourceModel, db
# from dembrane.chains import load_title_chain, load_summary_chain
# from dembrane.utils import run_with_timeout
# from dembrane.vectorstore import vectorstore

# logger = getLogger("process_resource")

# CHUNK_SIZE = 33000
# CHUNK_OVERLAP = 100

# logger.info(
#     f"Initializing text splitter with chunk size {CHUNK_SIZE} and overlap {CHUNK_OVERLAP}"
# )
# lc_text_splitter = CharacterTextSplitter(
#     separator="\n\n",
#     chunk_size=CHUNK_SIZE,
#     chunk_overlap=CHUNK_OVERLAP,
#     length_function=len,
#     is_separator_regex=False,
# )


# class EmptyDocumentException(Exception):
#     pass


# # Mutates the resource and also returns it
# # sets is_processed to True
# # adds title and description
# # adds to vectorstore
# def process_resource(resource: ResourceModel) -> ResourceModel:
#     session = resource.project.session
#     language = resource.project.language

#     if resource.is_processed == True:
#         logger.info(f"Document {resource.id} is already processed")
#         return resource

#     if resource.type != "PDF":
#         raise ValueError("Only PDF processing is supported")

#     lc_loader = PyPDFLoader(resource.path)

#     lc_documents = lc_loader.load_and_split(lc_text_splitter)

#     logger.info(f"Loaded {len(lc_documents)} chunks from {resource.path}")

#     if len(lc_documents) == 0:
#         raise EmptyDocumentException

#     first = lc_documents[0]
#     mid = lc_documents[len(lc_documents) // 2]
#     last = lc_documents[-1]

#     # summarize
#     lc_summarize_chain = load_summary_chain(language=language)
#     if len(lc_documents) < 3:
#         logger.info("Summarizing with only one chunk")
#         summary_result = lc_summarize_chain.invoke({"documents": [first]}).get(
#             "output_text"
#         )
#     else:
#         summary_result = lc_summarize_chain.invoke(
#             {"documents": [first, mid, last]}
#         ).get("output_text")

#     # get title
#     lc_title_chain = load_title_chain(language=language)
#     title = lc_title_chain.invoke({"text": summary_result})

#     # add metadata
#     for lc_doc in lc_documents:
#         lc_doc.metadata["session_id"] = session.id
#         lc_doc.metadata["project_id"] = resource.project.id
#         lc_doc.metadata["resource_id"] = resource.id

#     # embed and add to vectorstore
#     vectorstore.add_documents(lc_documents)

#     resource.title = title
#     resource.description = summary_result
#     resource.is_processed = True

#     db.add(resource)
#     db.commit()

#     return resource


# def process_resource_with_timeout(
#     resource: ResourceModel, timeout_sec: int
# ) -> ResourceModel:
#     return run_with_timeout(process_resource, args=[resource], timeout_sec=timeout_sec)


# class ProcessResourceTaskQueueItem:
#     logger = getLogger("ProcessResourceTaskQueueItem")

#     def __init__(
#         self,
#         resource: ResourceModel,
#         retry_left: int = 3,
#     ) -> None:
#         self.resource = resource
#         self.retry_left = retry_left

#     def __call__(self) -> None:
#         logger.info(f"Processing resource {self.resource.id}")
#         process_resource_with_timeout(self.resource, 300)
#         logger.info(f"Document {self.resource.id} processed successfully")


# # should be a singleton
# class ProcessResourceTaskQueue(Queue):
#     logger = getLogger("ProcessResourceTaskQueue")

#     def __init__(self, num_workers: int = 3) -> None:
#         super().__init__()
#         self.num_workers = num_workers
#         for _ in range(num_workers):
#             t = threading.Thread(target=self.worker)
#             t.daemon = True
#             t.start()

#     def add_task(self, item: ProcessResourceTaskQueueItem) -> None:  # noqa
#         logger.info(f"Adding task for resource {item.resource.id}")
#         self.put(item)

#     def worker(self) -> None:
#         while True:
#             item: ProcessResourceTaskQueueItem = self.get()
#             self.logger.info(f"Resource {item.resource.id} picked up by worker")
#             try:
#                 item()
#             except Exception as e:
#                 if isinstance(e, EmptyDocumentException):
#                     self.logger.error(f"Resource {item.resource.id} is empty")
#                     db.query(ResourceModel).filter(
#                         ResourceModel.id == item.resource.id
#                     ).update(
#                         values={
#                             "processing_error": "Unable to read text from the document"
#                         }
#                     )
#                     db.commit()

#                 elif item.retry_left == 0:
#                     self.logger.error(
#                         f"Failed to process document {item.resource.id} after retries"
#                     )
#                     db.query(ResourceModel).filter(
#                         ResourceModel.id == item.resource.id
#                     ).update(
#                         values={
#                             "processing_error": "Failed to process resource (Server error)"
#                         }
#                     )
#                     db.commit()

#                 else:
#                     item.retry_left -= 1
#                     self.logger.error(
#                         f"Failed to process document (Retries Left = {item.retry_left}): {e}"
#                     )
#                     self.put(item)
#             finally:
#                 self.task_done()


# process_resource_queue = ProcessResourceTaskQueue(num_workers=6)


# # init the queue with documents that don't have title and desc
# def seed_process_resource_queue() -> None:
#     resources = (
#         db.query(ResourceModel)
#         .filter(ResourceModel.is_processed == False)
#         .filter(ResourceModel.processing_error == None)
#         .all()
#     )
#     logger.info(
#         f"Seeding process resource queue with {len(resources)} pending resources"
#     )
#     for resource in resources:
#         process_resource_queue.add_task(ProcessResourceTaskQueueItem(resource=resource))


# if __name__ == "__main__":
#     pass
