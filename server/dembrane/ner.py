import logging

from trankit import Pipeline

from dembrane.config import TRANKIT_CACHE_DIR

p = Pipeline("english", embedding="xlm-roberta-large", cache_dir=TRANKIT_CACHE_DIR)
p.add("dutch")

# uses langid to switch to the correct language
p.set_auto(True)

logger = logging.getLogger("ner")

if __name__ == "__main__":
    logger.info("hello")
