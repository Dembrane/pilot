from directus_sdk_py import DirectusClient  # type: ignore

from dembrane.config import DIRECTUS_TOKEN, DIRECTUS_BASE_URL

directus = DirectusClient(url=DIRECTUS_BASE_URL, token=DIRECTUS_TOKEN)
