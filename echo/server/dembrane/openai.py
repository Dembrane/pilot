from openai import OpenAI

from dembrane.config import OPENAI_API_KEY, OPENAI_API_BASE_URL

client = OpenAI(base_url=OPENAI_API_BASE_URL, api_key=OPENAI_API_KEY)


if __name__ == "__main__":
    test_client = OpenAI(base_url=OPENAI_API_BASE_URL, api_key=OPENAI_API_KEY)
    print(test_client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": "Hello, how are you?"}]))
    print("done")