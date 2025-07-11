"use client";
import JsonEditorForm from "../components/EditFile/JsonEditorForm";
import PdfViewer from "../components/SimplePdfViewer";
import CompanyHeader from "../components/CompanyHeader";
import { useLocation, useNavigate } from "react-router-dom";

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

  const handleFormSubmit = (updatedData) => {
    console.log("Updated Data:", updatedData);
    navigate("/DCPreivew");
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
