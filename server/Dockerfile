# Base image
FROM python:3.11-slim

WORKDIR /processor

# System dependencies (for pdf2image, pdfkit, fonts)
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
  && apt-get clean


RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libfontconfig1 \
    fonts-dejavu \
    && apt-get clean

# Install wkhtmltopdf
RUN apt-get update && \
    apt-get install -y wkhtmltopdf




# Install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy backend code
COPY . .

EXPOSE 5000

CMD ["python", "processor.py"]