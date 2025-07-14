import { useState } from "react";

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
};

function JsonEditorForm({ data = initialData, onChange }) {
  // Ensure all arrays are properly initialized
  const initializeData = (inputData) => {
    return {
      nom: inputData?.nom || "",
      titre: inputData?.titre || "",
      competences: {
        langages_programmation:
          inputData?.competences?.langages_programmation || [],
        logiciels_techniques:
          inputData?.competences?.logiciels_techniques || [],
        competences_generales:
          inputData?.competences?.competences_generales || [],
        competences_manageriales:
          inputData?.competences?.competences_manageriales || [],
      },
      experience_professionnelle: inputData?.experience_professionnelle || [
        {
          titre_poste: "",
          entreprise: "",
          periode: "",
          description: [],
        },
      ],
      formation: inputData?.formation || [
        {
          diplome: "",
          etablissement: "",
          dates: "",
        },
      ],
      langues: inputData?.langues || [],
      competences_professionnelles:
        inputData?.competences_professionnelles || [],
      certifications: inputData?.certifications || [],
    };
  };

  const [formData, setFormData] = useState(initializeData(data));

  const updateFormData = (newData) => {
    setFormData(newData);
    onChange?.(newData);
    console.log(newData);
  };

  const handleChange = (path, value) => {
    const newData = JSON.parse(JSON.stringify(formData)); // Deep clone
    const keys = path.split(".");
    let obj = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;

    updateFormData(newData);
  };

  const handleArrayChange = (path, index, value) => {
    const newData = JSON.parse(JSON.stringify(formData)); // Deep clone
    const keys = path.split(".");
    let obj = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]][index] = value;

    updateFormData(newData);
  };

  const addArrayItem = (path, item) => {
    const newData = JSON.parse(JSON.stringify(formData)); // Deep clone
    const keys = path.split(".");
    let obj = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]].push(item);

    updateFormData(newData);
  };

  const removeArrayItem = (path, index) => {
    const newData = JSON.parse(JSON.stringify(formData)); // Deep clone
    const keys = path.split(".");
    let obj = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]].splice(index, 1);

    updateFormData(newData);
  };

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
                      onChange={(e) =>
                        handleArrayChange(
                          `competences.${key}`,
                          idx,
                          e.target.value
                        )
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-remove"
                      onClick={() => removeArrayItem(`competences.${key}`, idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-add"
                  onClick={() => addArrayItem(`competences.${key}`, "")}
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
                  const newData = JSON.parse(JSON.stringify(formData));
                  newData.experience_professionnelle[i].titre_poste =
                    e.target.value;
                  updateFormData(newData);
                }}
              />
              <input
                className="basic-input"
                placeholder="Entreprise"
                value={exp.entreprise}
                onChange={(e) => {
                  const newData = JSON.parse(JSON.stringify(formData));
                  newData.experience_professionnelle[i].entreprise =
                    e.target.value;
                  updateFormData(newData);
                }}
              />
              <div className="experience-period-full">
                <input
                  className="basic-input"
                  placeholder="Période"
                  value={exp.periode}
                  onChange={(e) => {
                    const newData = JSON.parse(JSON.stringify(formData));
                    newData.experience_professionnelle[i].periode =
                      e.target.value;
                    updateFormData(newData);
                  }}
                />
              </div>
              <div className="experience-description">
                <h5>Descriptions</h5>
                <div className="description-items">
                  {Array.isArray(exp.description) &&
                    exp.description.map((desc, j) => (
                      <div key={j} className="description-item-row">
                        <input
                          className="basic-input"
                          placeholder={`Description ${j + 1}`}
                          value={desc}
                          onChange={(e) => {
                            const newData = JSON.parse(
                              JSON.stringify(formData)
                            );
                            newData.experience_professionnelle[i].description[
                              j
                            ] = e.target.value;
                            updateFormData(newData);
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-remove"
                          onClick={() => {
                            const newData = JSON.parse(
                              JSON.stringify(formData)
                            );
                            newData.experience_professionnelle[
                              i
                            ].description.splice(j, 1);
                            updateFormData(newData);
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
                      const newData = JSON.parse(JSON.stringify(formData));
                      newData.experience_professionnelle[i].description.push(
                        ""
                      );
                      updateFormData(newData);
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
          onClick={() =>
            addArrayItem("experience_professionnelle", {
              titre_poste: "",
              entreprise: "",
              periode: "",
              description: [],
            })
          }
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
                  const newData = JSON.parse(JSON.stringify(formData));
                  newData.formation[i].diplome = e.target.value;
                  updateFormData(newData);
                }}
              />
              <input
                className="basic-input"
                placeholder="Établissement"
                value={f.etablissement}
                onChange={(e) => {
                  const newData = JSON.parse(JSON.stringify(formData));
                  newData.formation[i].etablissement = e.target.value;
                  updateFormData(newData);
                }}
              />
              <input
                className="basic-input"
                placeholder="Dates"
                value={f.dates}
                onChange={(e) => {
                  const newData = JSON.parse(JSON.stringify(formData));
                  newData.formation[i].dates = e.target.value;
                  updateFormData(newData);
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            addArrayItem("formation", {
              diplome: "",
              etablissement: "",
              dates: "",
            })
          }
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
                onChange={(e) =>
                  handleArrayChange("langues", i, e.target.value)
                }
              />
              <button
                type="button"
                className="btn btn-remove"
                onClick={() => removeArrayItem("langues", i)}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-add"
            onClick={() => addArrayItem("langues", "")}
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
                onChange={(e) =>
                  handleArrayChange(
                    "competences_professionnelles",
                    i,
                    e.target.value
                  )
                }
              />
              <button
                type="button"
                className="btn btn-remove"
                onClick={() =>
                  removeArrayItem("competences_professionnelles", i)
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-add"
            onClick={() => addArrayItem("competences_professionnelles", "")}
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
                onChange={(e) =>
                  handleArrayChange("certifications", i, e.target.value)
                }
              />
              <button
                type="button"
                className="btn btn-remove"
                onClick={() => removeArrayItem("certifications", i)}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-add"
            onClick={() => addArrayItem("certifications", "")}
          >
            + Ajouter certification
          </button>
        </div>
      </fieldset>
    </div>
  );
}

export default JsonEditorForm;
