# 📄 CV2DC – CV Standardization & Competence Dossier Generator

A Python + React application that extracts structured data from diverse resumes (CVs) and generates standardized, anonymized competence dossiers in PDF format for enterprise use.

---

## 🚀 Features

- 🔍 Extracts text from complex CV layouts using deep learning OCR (CRAFT + CRNN)
- 🧠 Utilizes LLMs (Gemini API) to convert raw text into structured JSON
- 🧾 Renders professional, anonymized competence dossiers as PDFs using custom HTML/CSS templates
- 🌐 Full-stack web application (React + Flask)
- 📦 Dockerized for easy deployment
- 🔁 Ongoing CI/CD and DevOps integration

---

## 🖼️ Use Case

In large organizations like Expleo, consultant CVs come in various formats. When presenting profiles to clients, only anonymized **competence dossiers** are needed. This system automates:
1. Text extraction from CVs
2. Structuring that text into a standardized format
3. PDF generation for anonymous dossier delivery

---

## ⚙️ Tech Stack

| Layer         | Stack / Tools                    |
|---------------|----------------------------------|
| Frontend      | React.js                         |
| Backend       | Flask (Python)                   |
| OCR           | CRAFT + CRNN (Deep Learning)     |
| LLM API       | Gemini Pro via API               |
| PDF Generation| HTML + CSS + pdfkit/WeasyPrint   |
| Containerization | Docker                        |
| DevOps        | CI/CD (WIP), DockerHub Repository |

---


## 🔧 Setup & Installation

### 🐳 Docker (Recommended)

1. Clone the repository:
   git clone https://github.com/<your-org>/cv2dc.git
   cd cv2dc

2. Run with Docker Compose:
   docker-compose up --build

3. App runs at: http://localhost:3000

### 🧪 Manual Setup (Dev mode)

#### Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py

#### Frontend
cd frontend
npm install
npm run dev

---

## 🔁 Workflow Overview

1. Upload CV (PDF)
2. OCR Processing using deep learning to extract raw text
3. LLM Formatting – Gemini API parses text into structured JSON
4. PDF Rendering – JSON fills an HTML/CSS template to generate the final document
5. Manual Editing – UI allows editing the structured data before final generation

---

## 📦 DockerHub

- Docker image: fatimazahraaithssaine/cv2dc

---

## 📅 Roadmap

- [ ] Finalize CI/CD integration
- [ ] Add version history for CVs
- [ ] Expand LLM fallback models (e.g., local or open source)
- [ ] Template customization per client

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.


## 🙋‍♀️ Authors

- Fatima Zahra Aithssaine: https://github.com/fatimazahrae03
- Abderrahmane Ammara: https://github.com/Ab-Amm
