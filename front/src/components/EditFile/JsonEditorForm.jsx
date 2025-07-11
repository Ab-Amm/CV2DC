
import { useState } from "react"

const initialData = {
  nom: "",
  titre: "",
  competences: {
    langages_programmation: [],
    logiciels_techniques: [],
    competences_generales: [],
    competences_manageriales: [],
  },
  experience_professionnelle: [
    {
      titre_poste: "",
      entreprise: "",
      periode: "",
      description: [],
    },
  ],
  formation: [
    {
      diplome: "",
      etablissement: "",
      dates: "",
    },
  ],
  langues: [],
  competences_professionnelles: [],
  certifications: [],
}

function JsonEditorForm({ data = initialData, onChange }) {
  const [formData, setFormData] = useState(data)

  const handleChange = (path, value) => {
    const newData = { ...formData }
    const keys = path.split(".")
    let obj = newData
    while ((keys || []).length > 1) {
      const key = keys.shift()
      obj = obj[key]
    }
    obj[keys[0]] = value
    setFormData(newData)
    onChange?.(newData)
  }

  const handleArrayChange = (path, index, value) => {
    const keys = path.split(".")
    const newData = { ...formData }
    let obj = newData
    while ((keys || []).length > 1) {
      obj = obj[keys.shift()]
    }
    obj[keys[0]][index] = value
    setFormData(newData)
    onChange?.(newData)
  }

  return (
    <div className="json-editor-form">
      <h2>Édition des Données</h2>

      <div className="form-field-group">
        <label htmlFor="nom">Nom</label>
        <input
          id="nom"
          type="text"
          className="basic-input"
          value={formData.nom}
          onChange={(e) => handleChange("nom", e.target.value)}
        />
      </div>

      <div className="form-field-group">
        <label htmlFor="titre">Titre</label>
        <input
          id="titre"
          type="text"
          className="basic-input"
          value={formData.titre}
          onChange={(e) => handleChange("titre", e.target.value)}
        />
      </div>

      <fieldset className="form-fieldset">
        <legend>Compétences</legend>
        <div className="competences-section">
          {Object.entries(formData.competences).map(([key, values]) => (
            <div key={key} className="competence-category">
              <h4>{key.replace(/_/g, " ")}</h4>
              <div className="competence-list">
                {values.map((val, idx) => (
                  <div key={idx} className="competence-item">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleArrayChange(`competences.${key}`, idx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-remove"
                      onClick={() => {
                        const newValues = values.filter((_, i) => i !== idx)
                        handleChange(`competences.${key}`, newValues)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-add"
                  onClick={() => handleChange(`competences.${key}`, [...values, ""])}
                >
                  + Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-fieldset">
        <legend>Expérience professionnelle</legend>
        {(formData.experience_professionnelle || []).map((exp, i) => (
          <div key={i} className="experience-section">
            <div className="experience-header">
              <div className="experience-number">{i + 1}</div>
            </div>
            <div className="experience-grid">
              <input
                className="basic-input"
                placeholder="Titre du poste"
                value={exp.titre_poste}
                onChange={(e) => {
                  const newList = [...formData.experience_professionnelle]
                  newList[i].titre_poste = e.target.value
                  handleChange("experience_professionnelle", newList)
                }}
              />
              <input
                className="basic-input"
                placeholder="Entreprise"
                value={exp.entreprise}
                onChange={(e) => {
                  const newList = [...formData.experience_professionnelle]
                  newList[i].entreprise = e.target.value
                  handleChange("experience_professionnelle", newList)
                }}
              />
              <div className="experience-period-full">
                <input
                  className="basic-input"
                  placeholder="Période"
                  value={exp.periode}
                  onChange={(e) => {
                    const newList = [...formData.experience_professionnelle]
                    newList[i].periode = e.target.value
                    handleChange("experience_professionnelle", newList)
                  }}
                />
              </div>
              <div className="experience-description">
                <h5>Descriptions</h5>
                <div className="description-items">
                  {(exp.description || []).map((desc, j) => (
                    <div key={j} className="description-item-row">
                      <input
                        className="basic-input"
                        placeholder={`Description ${j + 1}`}
                        value={desc}
                        onChange={(e) => {
                          const newList = [...formData.experience_professionnelle]
                          newList[i].description[j] = e.target.value
                          handleChange("experience_professionnelle", newList)
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-remove"
                        onClick={() => {
                          const newList = [...formData.experience_professionnelle]
                          newList[i].description.splice(j, 1)
                          handleChange("experience_professionnelle", newList)
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-add"
                    onClick={() => {
                      const newList = [...formData.experience_professionnelle]
                      if (!newList[i].description) newList[i].description = []
                      newList[i].description.push("")
                      handleChange("experience_professionnelle", newList)
                    }}
                  >
                    + Ajouter description
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const newExp = {
              titre_poste: "",
              entreprise: "",
              periode: "",
              description: [],
            }
            handleChange("experience_professionnelle", [...formData.experience_professionnelle, newExp])
          }}
        >
          + Ajouter expérience
        </button>
      </fieldset>

      <fieldset className="form-fieldset">
        <legend>Formation</legend>
        {(formData.formation || []).map((f, i) => (
          <div key={i} className="formation-section">
            <div className="formation-grid">
              <input
                className="basic-input"
                placeholder="Diplôme"
                value={f.diplome}
                onChange={(e) => {
                  const list = [...formData.formation]
                  list[i].diplome = e.target.value
                  handleChange("formation", list)
                }}
              />
              <input
                className="basic-input"
                placeholder="Établissement"
                value={f.etablissement}
                onChange={(e) => {
                  const list = [...formData.formation]
                  list[i].etablissement = e.target.value
                  handleChange("formation", list)
                }}
              />
              <input
                className="basic-input"
                placeholder="Dates"
                value={f.dates}
                onChange={(e) => {
                  const list = [...formData.formation]
                  list[i].dates = e.target.value
                  handleChange("formation", list)
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            handleChange("formation", [...formData.formation, { diplome: "", etablissement: "", dates: "" }])
          }}
        >
          + Ajouter formation
        </button>
      </fieldset>

      <fieldset className="form-fieldset languages-section">
        <legend>Langues</legend>
        <div className="simple-list">
          {(formData.langues || []).map((langue, i) => (
            <div key={i} className="simple-list-item">
              <input
                type="text"
                className="basic-input"
                value={langue}
                onChange={(e) => handleArrayChange("langues", i, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-remove"
                onClick={() => {
                  const newLangues = formData.langues.filter((_, idx) => idx !== i)
                  handleChange("langues", newLangues)
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-add"
            onClick={() => handleChange("langues", [...formData.langues, ""])}
          >
            + Ajouter langue
          </button>
        </div>
      </fieldset>

      <fieldset className="form-fieldset skills-section">
        <legend>Compétences professionnelles</legend>
        <div className="simple-list">
          {(formData.competences_professionnelles || []).map((c, i) => (
            <div key={i} className="simple-list-item">
              <input
                type="text"
                className="basic-input"
                value={c}
                onChange={(e) => handleArrayChange("competences_professionnelles", i, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-remove"
                onClick={() => {
                  const newSkills = formData.competences_professionnelles.filter((_, idx) => idx !== i)
                  handleChange("competences_professionnelles", newSkills)
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-add"
            onClick={() => handleChange("competences_professionnelles", [...formData.competences_professionnelles, ""])}
          >
            + Ajouter compétence
          </button>
        </div>
      </fieldset>

      <fieldset className="form-fieldset certifications-section">
        <legend>Certifications</legend>
        <div className="simple-list">
          {(formData.certifications || []).map((c, i) => (
            <div key={i} className="simple-list-item">
              <input
                type="text"
                className="basic-input"
                value={c}
                onChange={(e) => handleArrayChange("certifications", i, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-remove"
                onClick={() => {
                  const newCerts = formData.certifications.filter((_, idx) => idx !== i)
                  handleChange("certifications", newCerts)
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-add"
            onClick={() => handleChange("certifications", [...formData.certifications, ""])}
          >
            + Ajouter certification
          </button>
        </div>
      </fieldset>
    </div>
  )
}

export default JsonEditorForm
