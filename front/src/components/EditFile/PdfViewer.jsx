"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"

const workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

function PdfViewer({ file }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const goToPrevPage = () => setPageNumber((prev) => (prev <= 1 ? 1 : prev - 1))
  const goToNextPage = () => setPageNumber((prev) => (prev >= numPages ? numPages : prev + 1))

  return (
    <div className="pdf-viewer-container">

      <div className="pdf-document-container">
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          <div className="pdf-page-wrapper">
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={450} // Increased from 350 to 450
              scale={1.2} // Added scale for better quality
            />
          </div>
        </Document>

        <div className="pdf-page-info">
          📄 Page {pageNumber} sur {numPages || "--"}
        </div>
      </div>

      <div className="pdf-navigation">
        <button className="pdf-nav-button prev" onClick={goToPrevPage} disabled={pageNumber <= 1}>
          Précédent
        </button>
        <span
          style={{
            color: "var(--primary-600)",
            fontWeight: "600",
            fontSize: "0.875rem",
          }}
        >
          {pageNumber} / {numPages || 0}
        </span>
        <button className="pdf-nav-button next" onClick={goToNextPage} disabled={pageNumber >= numPages}>
          Suivant
        </button>
      </div>
    </div>
  )
}

export default PdfViewer