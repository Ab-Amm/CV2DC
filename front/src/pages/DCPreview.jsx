"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import CompanyHeader from "../components/CompanyHeader";
import { useLocation } from "react-router-dom";
import axios from "axios";

const workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const DCPreview = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isConverting, setIsConverting] = useState(false);

  const location = useLocation();
  const result = location?.state?.pdfUrl;
  const nom = location?.state?.nom;
  const pdfFilename = location?.state?.pdfFilename;

  console.log("nom:", nom);
  console.log("result:", result);
  console.log("pdfFilename:", pdfFilename);

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

  const handleConvertToWord = async () => {
    if (!pdfFilename) {
      alert("Nom du fichier PDF non disponible");
      return;
    }

    setIsConverting(true);
    try {
      console.log("Converting to Word...");
      const response = await axios.post("http://localhost:5000/convert-to-word", {
        pdf_filename: pdfFilename,
      });

      console.log("Word conversion response:", response.data);

      const { word_base64, word_filename } = response.data;

      // Créer un blob à partir du base64
      const byteCharacters = atob(word_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      });

      // Créer un lien de téléchargement
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `DC_${nom}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Nettoyer l'URL de l'objet
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Error converting to Word:", error);
      alert("Erreur lors de la conversion en Word: " + error.message);
    } finally {
      setIsConverting(false);
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
            <button className="btn btn-primary" onClick={handleDownload}>
              <span className="download-icon">📥</span>
              Télécharger le CV
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleConvertToWord}
              disabled={isConverting}
            >
              <span className="download-icon">📝</span>
              {isConverting ? "Conversion en cours..." : "Télécharger en Word"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DCPreview;