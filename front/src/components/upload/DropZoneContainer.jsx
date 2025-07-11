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
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          <button className="submit-button" onClick={handleSubmit}>
            Traiter le fichier
          </button>
        </div>
      )}
    </div>
  );
}

export default DropzoneContainer;
