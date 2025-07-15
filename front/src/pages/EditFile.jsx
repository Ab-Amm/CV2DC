"use client";
import JsonEditorForm from "../components/EditFile/JsonEditorForm";
import PdfViewer from "../components/SimplePdfViewer";
import CompanyHeader from "../components/CompanyHeader";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

const EditFile = () => {

  const createPdfUrl = (base64String) => {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  };

  const navigate = useNavigate();


  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  console.log(queryParams.get("data"));
  const fileUrl = location?.state?.fileUrl;
  const result = location?.state?.result;

  const maybeJSON = result.structured_cv;

  let yourExtractedData;
  try {
    yourExtractedData =
      typeof maybeJSON === "string" ? JSON.parse(maybeJSON) : maybeJSON;
  } catch (err) {
    console.error("Failed to parse JSON:", err);
  }
  console.log(yourExtractedData);

  const [updatedData, setUpdatedData] = useState(yourExtractedData);

  console.log(updatedData);

  const handleFormSubmit = async (updatedData) => {
    try {
      console.log(" Updated data:", updatedData);
      const response = await axios.post("http://backend:5000/DC", {
        structured_cv: updatedData,
      });

      console.log("Response data:", response.data);

      const pdf_base64 = response.data.pdf_base64;
      const pdf_filename = response.data.pdf_filename;
      let pdf_url;

      pdf_url = createPdfUrl(pdf_base64);

      console.log(pdf_filename);
      console.log(pdf_base64);
      console.log(pdf_url);

      console.log("Updated data:", updatedData);


      navigate("/DCPreview", {
        state: {
          pdfFilename: pdf_filename,
          pdfBase64: pdf_base64,
          pdfUrl: pdf_url,
          nom: updatedData.nom,
        },
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="app-container">
      <CompanyHeader nom={yourExtractedData.nom} />

      <div className="edit-file-page">
        <div className="edit-file-wrapper">
          <div className="edit-file-container slide-up">
            <div className="editor-section">
              <div className="editor-content">
                <JsonEditorForm
                  data={yourExtractedData}
                  onChange={(updatedData) => {
                    console.log(updatedData);
                    setUpdatedData(updatedData); // store the updated data
                  }}
                />
              </div>
              <div className="editor-actions">
                <button
                  className="btn btn-submit"
                  onClick={() => handleFormSubmit(updatedData)}
                >
                  💾 Sauvegarder les modifications
                </button>
              </div>
            </div>

            <div className="pdf-section">
              <PdfViewer file={fileUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFile;
