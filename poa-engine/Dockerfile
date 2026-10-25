FROM python:3.12-slim

# Install system runtime dependencies: tesseract-ocr, poppler-utils
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definition and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code and declarative rules
COPY . .

# Cloud Run defaults: PORT 8080
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
