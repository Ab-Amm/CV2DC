"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import CompanyHeader from "../components/CompanyHeader";
import { useLocation } from "react-router-dom";
import axios from "axios";
let log = console.log;

const workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const DCPreview = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);

  const location = useLocation();
  const result = location?.state?.pdfUrl;
  const nom = location?.state?.nom;

  console.log("nom:", nom);
  console.log("result:", result);

  const pdfFile = result;

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPrevPage = () =>
    setPageNumber((prev) => (prev <= 1 ? 1 : prev - 1));
  const goToNextPage = () =>
    setPageNumber((prev) => (prev >= numPages ? numPages : prev + 1));

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfFile;
    link.download = `DC_${nom}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

// Fonction handleWordDownload mise à jour dans DCPreview.jsx
const handleWordDownload = async () => {
  if (!pdfFile) {
    alert("Fichier PDF non trouvé.");
    return;
  }

  setIsDownloadingWord(true);

  try {
    log("Downloading Word...");
    
    // Convertir l'URL blob en Blob
    const response = await fetch(pdfFile);
    const pdfBlob = await response.blob();
    
    // Créer FormData pour envoyer le fichier
    const formData = new FormData();
    formData.append('pdf_file', pdfBlob, `${nom || 'document'}.pdf`);
    
    // Envoyer le fichier au serveur
    const convertResponse = await axios.post(
      "http://localhost:5000/convert-to-docx",
      formData,
      { 
        responseType: "blob",
        timeout: 120000, // 2 minutes timeout pour Adobe PDF Services
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    log("Word downloaded successfully.");

    // Gérer la réponse réussie
    if (convertResponse.data instanceof Blob) {
      const blob = new Blob([convertResponse.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DC_${nom || "converted"}_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log("Document Word téléchargé avec succès");
    } else {
      throw new Error("Format de réponse invalide");
    }

  } catch (error) {
    console.error("Erreur lors du téléchargement Word:", error);
    
    // Gestion d'erreur améliorée
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData && errorData.error) {
        alert(`Erreur: ${errorData.error}`);
      } else {
        alert("Erreur: Fichier PDF invalide ou données manquantes.");
      }
    } else if (error.response?.status === 500) {
      alert("Erreur serveur lors de la conversion. Veuillez réessayer.");
    } else if (error.code === 'ECONNABORTED') {
      alert("Timeout: La conversion prend trop de temps. Veuillez réessayer.");
    } else {
      alert("Échec de la génération du document Word. Veuillez vérifier votre connexion et réessayer.");
    }
  } finally {
    setIsDownloadingWord(false);
  }
};


  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setScale(1.2);

  return (
    <div className="app-container">
      <CompanyHeader />
      <div className="pdf-preview-page">
        <div className="pdf-preview-container">
          {/* Header */}
          <div className="pdf-preview-header">
            <div className="header-content">
              <h1>Aperçu du CV Généré</h1>
              <p>Prévisualisez votre CV avant de le télécharger</p>
            </div>
          </div>

          {/* PDF Viewer Section */}
          <div className="pdf-viewer-section">
            <div className="pdf-controls-top">
              <div className="zoom-controls">
                <button
                  className="btn btn-zoom"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.6}
                >
                  🔍-
                </button>
                <span className="zoom-level">{Math.round(scale * 100)}%</span>
                <button
                  className="btn btn-zoom"
                  onClick={handleZoomIn}
                  disabled={scale >= 2.0}
                >
                  🔍+
                </button>
                <button
                  className="btn btn-zoom-reset"
                  onClick={handleResetZoom}
                >
                  Réinitialiser
                </button>
              </div>

              <div className="page-info">
                Page {pageNumber} sur {numPages || "--"}
              </div>
            </div>

            <div className="pdf-display">
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                className="pdf-document"
              >
                <div className="pdf-page-container">
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    scale={scale}
                    className="pdf-page"
                  />
                </div>
              </Document>
            </div>

            <div className="pdf-navigation">
              <button
                className="btn btn-nav prev"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
              >
                ← Précédent
              </button>

              <div className="page-selector">
                <input
                  type="number"
                  min="1"
                  max={numPages || 1}
                  value={pageNumber}
                  onChange={(e) => {
                    const page = Number.parseInt(e.target.value);
                    if (page >= 1 && page <= numPages) {
                      setPageNumber(page);
                    }
                  }}
                  className="page-input"
                />
                <span>/ {numPages}</span>
              </div>

              <button
                className="btn btn-nav next"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
              >
                Suivant →
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => window.history.back()}
            >
              ← Retour à l'édition
            </button>
            <div className="download-buttons">
              <button className="btn btn-primary" onClick={handleDownload}>
                <span className="download-icon">📥</span>
                Télécharger PDF
              </button>
              <button 
                className="btn btn-primary btn-word" 
                onClick={handleWordDownload}
                disabled={isDownloadingWord}
              >
                <span className="download-icon">📄</span>
                {isDownloadingWord ? 'Génération...' : 'Télécharger Word'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DCPreview;