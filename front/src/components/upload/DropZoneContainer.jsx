"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import DropOverlay from "./DropOverlay";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function DropzoneContainer() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    const withPreview = acceptedFiles.map((file) =>
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
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Préparation du fichier...");

    try {
      setUploadProgress(20);
      setUploadStatus("Téléchargement en cours...");
      const response = await axios.post(
        "http://localhost:5000/process",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(Math.min(progress, 70)); // Cap at 70% for upload
            setUploadStatus(`Téléchargement... ${progress}%`);
          },
        }
      );
      setUploadProgress(80);
      setUploadStatus("Traitement du document...");

      console.log(response);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setUploadProgress(95);
      setUploadStatus("Finalisation...");
      const data = response.data;

      if (data.error) {
        console.error("Server error:", data.error);
        setUploadStatus("Erreur lors du traitement");
        setIsUploading(false);
        return;
      } else {
        console.log("Navigating with:", {
          fileUrl,
          fileName: file.name,
          result: data,
        });

        setTimeout(() => {
          navigate("/EditFile", {
            state: {
              fileUrl,
              fileName: file.name,
              result: data,
            },
          });
        }, 500);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("Erreur lors du téléchargement");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="dropzone-container">
      {/* Loading Overlay */}
      {isUploading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h3 className="loading-title">Traitement en cours</h3>
            <p className="loading-status">{uploadStatus}</p>
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
            <div className="loading-steps">
              <div
                className={`step ${
                  uploadProgress >= 20
                    ? "completed"
                    : uploadProgress >= 10
                    ? "active"
                    : ""
                }`}
              >
                <span className="step-icon">📤</span>
                <span className="step-text">Téléchargement</span>
              </div>
              <div
                className={`step ${
                  uploadProgress >= 80
                    ? "completed"
                    : uploadProgress >= 70
                    ? "active"
                    : ""
                }`}
              >
                <span className="step-icon">⚙️</span>
                <span className="step-text">Traitement</span>
              </div>
              <div
                className={`step ${
                  uploadProgress >= 100
                    ? "completed"
                    : uploadProgress >= 95
                    ? "active"
                    : ""
                }`}
              >
                <span className="step-icon">✅</span>
                <span className="step-text">Finalisation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`dropzone-main ${isUploading ? "uploading" : ""}`}></div>
      <div
        {...getRootProps()}
        className={`dropzone-area ${isDragActive ? "drag-active" : ""}`}
      >
        <input {...getInputProps()} disabled={isUploading} />{" "}
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

      {files.length > 0 && (
        <div className="preview-section">
          <div className="preview-header">
            <h3>Fichiers sélectionnés</h3>
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
                    <strong>Taille:</strong> {(file.size / 1024).toFixed(1)} KB
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
                  disabled={isUploading}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          <button
            className={`submit-button ${isUploading ? "loading" : ""}`}
            onClick={handleSubmit}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <div className="button-spinner"></div>
                <span>{uploadStatus}</span>
              </>
            ) : (
              <>
                <span className="submit-icon">🚀</span>
                <span>Traiter le fichier</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default DropzoneContainer;
