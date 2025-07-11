import DropzoneContainer from "../components/upload/DropZoneContainer"
import CompanyHeader from "../components/CompanyHeader"

const Upload = () => {

  


  return (
    <div className="app-container">
      <CompanyHeader />

      <div className="upload-page">
        <div className="upload-container fade-in">
          <div className="upload-header">
            <h1>DC Generator</h1>
            <p>Téléchargez votre CV pour une extraction automatique des données</p>
          </div>
          <DropzoneContainer />
        </div>
      </div>
    </div>
  )
}

export default Upload
