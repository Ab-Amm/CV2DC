"use client";
import JsonEditorForm from "../components/EditFile/JsonEditorForm";
import PdfViewer from "../components/SimplePdfViewer";
import CompanyHeader from "../components/CompanyHeader";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const EditFile = () => {
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

  const handleFormSubmit = async (updatedData) => {
    try {
      console.log(" Updated data:", updatedData);
      const response = axios.post("http://localhost:5000/DC", {
        structured_cv: updatedData,
      });

      console.log( "Response data:", response.data);

      const { pdf_filename, pdf_base64 } = response.data;

      console.log(pdf_filename, pdf_base64);
      navigate("/DCPreview", {
      state: {
        pdfFilename: pdf_filename,
        pdfBase64: pdf_base64,
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
                  onChange={(updatedData) => console.log(updatedData)}
                />
              </div>
              <div className="editor-actions">
                <button
                  className="btn btn-submit"
                  onClick={() => handleFormSubmit(yourExtractedData)}
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
