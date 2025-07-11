"use client";
import JsonEditorForm from "../components/EditFile/JsonEditorForm";
import PdfViewer from "../components/SimplePdfViewer";
import CompanyHeader from "../components/CompanyHeader";
import { useLocation, useNavigate } from "react-router-dom";

const EditFile = () => {
  const navigate = useNavigate();
  const yourExtractedData = {
    nom: "Y. MOUR",
    titre: "Chef de Service Achat",
    competences: {
      langages_programmation: [],
      logiciels_techniques: [
        "Pack Office",
        "SAP",
        "MS Project",
        "Sphinx",
        "Sage comptabilité",
        "100 MFGPRO",
        "GANTT project",
      ],
      competences_generales: [
        "Esprit de travail en équipe",
        "Esprit associatif",
      ],
      competences_manageriales: [
        "Gestion",
        "Optimisation",
        "Négociation",
        "Audit interne",
        "Leadership",
      ],
    },
    experience_professionnelle: [
      {
        titre_poste: "Chef de Service Achat",
        entreprise: "ACOME MAROC",
        periode: "2018/Aujourdhui",
        description: [
          "Gérer, optimiser l'achat et l'approvisionnement",
          "Traiter des demandes d'achat",
          "Lancer des appels d'offres",
          "Réaliser des études financières et techniques des offres",
          "Evaluer les propositions des fournisseurs",
          "Gérer le portefeuille fournisseur",
          "Passer les commandes et assurer le suivi des livraisons",
          "Garantir l'interface clients internes et fournisseurs",
          "Suivre les contrats",
          "Résoudre les éventuels litiges commerciaux et financiers",
          "Assurer une veille sur le marché",
          "Assurer le suivi des indicateurs et élaboration des reportings mensuels",
        ],
      },
      {
        titre_poste: "Stage de perfection",
        entreprise: "ACOME MAROC",
        periode: "2017/2018",
        description: [
          "Participer aux travaux d'inventaire",
          "Assurer la comptabilisation des factures",
          "Elaborer les Reportings du CA hebdomadaires",
          "Participer à l'élaboration du FOND HASSAN 2",
          "Préparer les virements",
          "Assurer la facturation",
        ],
      },
      {
        titre_poste: "Stage de fin d'étude",
        entreprise: "ELTOROTRANS SAR",
        periode: "2015/2016",
        description: [
          "Optimiser la fonction achat dans la logistique automobile",
        ],
      },
      {
        titre_poste: "Stage d'application",
        entreprise: "LEAR AS",
        periode: "2014/2015",
        description: ["Auditer et réaliser le contrôle interne du achat"],
      },
      {
        titre_poste: "Stage de fin d'étude",
        entreprise: "Attijariwafa Bank",
        periode: "2012/2013",
        description: [
          "Réaliser une étude de satisfaction des clients de l'agence Rue de Belgique",
        ],
      },
    ],
    formation: [
      {
        diplome: "Master en E-Logistique et supply chain durable",
        etablissement: "L'université de Versailles ST-Quentin (SUPTEM-BMHS)",
        dates: "2015-2016",
      },
      {
        diplome: "Master en Finance; Audit et Contrôle de Gestion",
        etablissement:
          "L'Ecole Supérieure des Sciences Techniques et de Management (SUPTEM-BMHS)",
        dates: "2013-2015",
      },
      {
        diplome: "Licence en Management",
        etablissement:
          "L'Ecole Supérieure des Sciences Techniques et de Management (SUPTEM-BMHS)",
        dates: "2010-2013",
      },
      {
        diplome: "Baccalauréat en sciences économiques",
        etablissement: "Lycée MOULAY RACHID, Chefchaouen",
        dates: "2009-2010",
      },
    ],
    langues: [
      "Arabe – Courant",
      "Français – Courant",
      "Anglais – Intermédiaire",
      "Espagnol – Intermédiaire",
    ],
  };

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const fileUrl = queryParams.get("url");

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
