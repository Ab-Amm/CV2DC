# Base image
FROM python:3.11-slim

WORKDIR /processor

# System dependencies (for pdf2image, pdfkit, fonts, Adobe SDK)
RUN apt-get update && apt-get install -y \
    poppler-utils \
    xfonts-base \
    xfonts-75dpi \
    wget \
    fontconfig \
    libxrender1 \
    libjpeg62-turbo \
    libxtst6 \
    libx11-6 \
    libxext6 \
    libssl-dev \
    libglib2.0-0 \
    libsm6 \
    libxrender-dev \
    libfontconfig1 \
    fonts-dejavu \
    tesseract-ocr \
    wkhtmltopdf \
    openjdk-17-jre-headless \
    && apt-get clean

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy backend code and credentials
COPY . .

# Set environment variable for Adobe PDF Services credentials
ENV PDF_SERVICES_CREDENTIALS_PATH=/processor/pdftools-api-credentials.json

EXPOSE 5000

CMD ["python", "processor.py"]
