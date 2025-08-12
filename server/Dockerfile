# Step 1: Lightweight base
FROM python:3.11-slim

WORKDIR /processor

# Step 2: Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    wkhtmltopdf \
    fonts-dejavu \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Step 3: Install CPU-only torch and torchvision (no audio needed)
RUN pip install --no-cache-dir torch==2.2.1 torchvision==0.17.1 --index-url https://download.pytorch.org/whl/cpu

# Step 4: Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy app source code
COPY . .

ENV PDF_SERVICES_CREDENTIALS_PATH=/processor/pdftools-api-credentials.json

EXPOSE 5000
CMD ["python", "processor.py"]
