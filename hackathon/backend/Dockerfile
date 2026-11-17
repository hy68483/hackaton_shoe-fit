FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    "torch==2.15.0" \
    "torchvision==0.29.2"
RUN pip install --no-cache-dir -r requirements.txt

# SQLAlchemy 2.1 installs greenlet only when the asyncio extra is requested.
RUN pip install --no-cache-dir "sqlalchemy[asyncio]"

COPY app ./app
COPY scripts ./scripts

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
