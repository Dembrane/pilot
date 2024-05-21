FROM python:3.11

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1
# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

# The virtual environment is created in the working directory where rye is run
# so the development and production environments must be in the same directory respectively.
WORKDIR /code

RUN \
    --mount=type=cache,target=/var/lib/apt/lists \
    --mount=type=cache,target=/var/cache/apt/archives \
    apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    ffmpeg 

COPY requirements.lock /code/requirements.lock
RUN pip install --no-cache-dir -r requirements.lock

COPY ./ /code

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Switch to the non-privileged user to run the application.
USER appuser

EXPOSE 8000

CMD ["uvicorn", "dembrane.main:app", "--host", "0.0.0.0", "--proxy-headers"]
