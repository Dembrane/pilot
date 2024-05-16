FROM python:3.11

WORKDIR /code

### system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV RYE_INSTALL_OPTION=--yes
RUN curl -sSf https://rye-up.com/get | bash

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir -r /code/requirements.txt

COPY ./ /code

EXPOSE 8000

CMD ["uvicorn", "dembrane.main:app", "--host", "0.0.0.0", "--proxy-headers"]
