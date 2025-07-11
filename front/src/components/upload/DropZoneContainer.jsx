"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import DropOverlay from "./DropOverlay";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function DropzoneContainer() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    // Filtrer pour accepter seulement les PDFs
    const pdfFiles = acceptedFiles.filter(file => file.type === "application/pdf")
    
    if (pdfFiles.length === 0) {
      setError("Seuls les fichiers PDF sont acceptés")
      return
    }

    const withPreview = pdfFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        uploadedAt: new Date(),
      })
    );
    setFiles(withPreview);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleSubmit = async () => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileUrl = URL.createObjectURL(file);

    const formData = new FormData();
    formData.append("file", file);

    console.log(formData);

    try {
      const response = await axios.post(
        "http://localhost:5000/process",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log(response);

      const data = response.data;

      if (data.error) {
        console.error("Server error:", data.error);
      } else {
        console.log("Navigating with:", {
          fileUrl,
          fileName: file.name,
          result: data,
        });

        navigate("/EditFile", {
          state: {
            fileUrl,
            fileName: file.name,
            result: data,
          },
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div className="dropzone-container">
      <div
        {...getRootProps()}
        className={`dropzone-area ${isDragActive ? "drag-active" : ""}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <DropOverlay />
        ) : (
          <div className="dropzone-content">
            <span className="dropzone-icon">📁</span>
            <p className="dropzone-text">
              Cliquez pour sélectionner des fichiers
            </p>
            <p className="dropzone-subtext">
              ou glissez-déposez vos fichiers ici
            </p>
          </div>
        )}
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="error-section">
          <div className="error-message">
            ❌ {error}
          </div>
        </div>
      )}

      {/* Section de prévisualisation des fichiers */}
      {files.length > 0 && (
        <div className="preview-section">
          <div className="preview-header">
            <h3>Fichier sélectionné</h3>
          </div>
          {files.map((file, index) => (
            <div key={index} className="preview-item">
              <div className="preview-thumbnail">
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.preview || "/placeholder.svg"}
                    alt={file.name}
                    className="preview-image"
                  />
                ) : (
                  <div className="preview-placeholder">
                    <span className="file-icon">📄</span>
                  </div>
                )}
              </div>
              <div className="preview-details">
                <div className="preview-filename">{file.name}</div>
                <div className="preview-metadata">
                  <div className="preview-metadata-item">
                    <strong>Taille:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className="preview-metadata-item">
                    <strong>Date:</strong> {file.uploadedAt.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="preview-actions">
                <button
                  className="btn btn-remove"
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          
          <div className="action-buttons">
            <button 
              className="submit-button" 
              onClick={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? "Traitement en cours..." : "Traiter le CV"}
            </button>
            
            {results && (
              <button 
                className="reset-button" 
                onClick={resetForm}
              >
                Nouveau fichier
              </button>
            )}
          </div>
        </div>
      )}

      {/* Indicateur de progression */}
      {isProcessing && (
        <div className="processing-section">
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p>{processingProgress}</p>
          </div>
        </div>
      )}

      {/* Affichage des résultats */}
      {results && (
        <div className="results-section">
          <div className="results-header">
            <h3>✅ Résultats du traitement</h3>
          </div>
          
          {/* Statistiques */}
          <div className="stats-section">
            <h4>📊 Statistiques:</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <strong>Pages traitées:</strong> {results.summary.total_pages}
              </div>
              <div className="stat-item">
                <strong>Segments de texte:</strong> {results.summary.total_segments}
              </div>
              <div className="stat-item">
                <strong>Caractères:</strong> {results.summary.total_characters}
              </div>
              <div className="stat-item">
                <strong>Mots:</strong> {results.summary.total_words}
              </div>
            </div>
          </div>

          {/* Parsing Groq */}
          {results.groq_parsing && (
            <div className="groq-section">
              <h4>🧠 Analyse Groq AI:</h4>
              {results.groq_parsing.success ? (
                <div className="groq-success">
                  ✅ Analyse réussie
                </div>
              ) : (
                <div className="groq-error">
                  ❌ Erreur: {results.groq_parsing.error}
                </div>
              )}
            </div>
          )}

          {/* CV formaté */}
          {results.formatted_cv && (
            <div className="formatted-cv-section">
              <h4>📋 CV Formaté:</h4>
              <div className="formatted-cv-content">
                <pre>{results.formatted_cv}</pre>
              </div>
            </div>
          )}

          {/* Données structurées */}
          {results.structured_cv && (
            <div className="structured-cv-section">
              <h4>🔧 Données Structurées:</h4>
              <div className="structured-cv-content">
                <pre>{JSON.stringify(results.structured_cv, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Texte brut */}
          <div className="raw-text-section">
            <h4>📖 Texte extrait:</h4>
            <div className="raw-text-content">
              <textarea 
                value={results.summary.full_text} 
                readOnly 
                rows={10}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DropzoneContainer;
