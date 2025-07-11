import os
import json
import logging
from groq import Groq
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GroqCVParser:
    """Parser to extract structured JSON from CV text using Groq API"""
    def __init__(self, api_key: str = None):
        """Initialize the Groq parser with API key"""
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=self.api_key)
        
    def create_structuring_prompt(self, extracted_text: str) -> str:
        """Create the prompt for structuring CV text"""
        prompt = f"""You are a data extraction specialist tasked with converting unstructured text from a PDF into a structured JSON format. Your goal is to accurately extract and normalize relevant professional information.

        ---

        ### Input:
        \"\"\"{extracted_text}\"\"\"

        ### Output:
        Return **only** a valid JSON object with the following structure (no explanations or comments):

        {{
        "nom": "",                          // Format: first initial + dot + space + first three letters of last name (e.g., "S. CHA" for Soufiane Chaker)
        "titre": "",                        // Generate it based on the overall information at hand
        "competences": {{
            "langages_programmation": [],     // e.g., "Python", "Java"
            "logiciels_techniques": [],       // e.g., "AutoCAD", "Tableau"
            "competences_generales": [],      // e.g., "Communication", "Problem-solving"
            "competences_manageriales": []    // e.g., "Leadership", "Team management"
        }},
        "experience_professionnelle": [
            {{
            "titre_poste": "",              // Job title (include client company name if mentioned in description, typically noticed by ".... pour Toyota" or ".... pour Oracle")
            "entreprise": "",               // Company name (if separable from job title, they are often isolated, or within the job title)
            "periode": "",                  // Duration or date range
            "description": ""               // Tasks or responsibilities, into bullet points
            }}
        ],
        "formation": [
            {{
            "diplome": "",
            "etablissement": "",
            "dates": ""
            }}
        ],
        "langues": []                       // e.g., "Français – Courant", "Anglais – Intermédiaire"
        }}

        ### Additional Rules:

        1. Remove any introductory sections like "Profil", "Profil professionnel", etc. These should not appear in the output.
        2. If a section titled "Compétences professionnelles" (or similar) is present, return an **additional** JSON object:
        {{
        "competences_professionnelles": []
        }}
        3. If a section on certifications is found (e.g., "Certifications", "Certificats", etc.), return another **additional** JSON object:
        {{
        "certifications": []
        }}
        4. Only include these additional JSON objects if their sections clearly exist in the input text.
        5. Ensure the output is fully valid JSON. Do not include any explanations, comments, or text outside the JSON structure."""
                
        return prompt
    
    def extract_json_from_text(self, text: str) -> str:
        """Extract JSON string from response text"""
        start_index = text.find('{')
        if start_index == -1:
            raise ValueError("No JSON object found in the input text.")
        json_str = text[start_index:]
        return json_str
    
    def parse_cv_text(self, extracted_text: str) -> Dict[str, Any]:
        """Parse CV text using Groq API and return structured JSON"""
        try:
            logger.info("Sending CV text to Groq for structuring...")
            
            # Create prompt
            prompt = self.create_structuring_prompt(extracted_text)
            
            # Send request to Groq
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2050,
            )
            
            # Extract response
            raw_response = response.choices[0].message.content.strip()
            logger.info("Received response from Groq")
            
            # Extract JSON from response
            json_str = self.extract_json_from_text(raw_response)
            
            # Parse JSON
            try:
                structured_data = json.loads(json_str)
                logger.info("Successfully parsed JSON from Groq response")
                return {
                    'success': True,
                    'data': structured_data,
                    'raw_response': raw_response
                }
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {e}")
                return {
                    'success': False,
                    'error': f'Invalid JSON returned: {str(e)}',
                    'raw_response': raw_response
                }
                
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return {
                'success': False,
                'error': f'API call failed: {str(e)}'
            }
    
    def format_cv_json(self, data: Dict[str, Any]) -> str:
        """Format the parsed CV data as pretty JSON"""
        if data.get('success'):
            return json.dumps(data['data'], indent=2, ensure_ascii=False)
        else:
            return json.dumps(data, indent=2, ensure_ascii=False)

# Standalone functions for easy integration
def parse_cv_with_groq(extracted_text: str, api_key: str = None) -> Dict[str, Any]:
    """Parse CV text using Groq API - standalone function"""
    parser = GroqCVParser(api_key)
    return parser.parse_cv_text(extracted_text)

def format_cv_data(data: Dict[str, Any]) -> str:
    """Format CV data as JSON string - standalone function"""
    parser = GroqCVParser()
    return parser.format_cv_json(data)

# Example usage and testing
if __name__ == "__main__":
    # Example extracted text (you would replace this with actual OCR output)
    sample_text = """
    Yassine Mourhri AV Moulay Drisso 81, Dradeb, Tanger 06 78 50 28 05 Yassine_mourhri@live fr Né le 07/09/1992 Formation universitaire 2015-2016 Master en E-Logistique et supply chain durable L'université de Versailles ST-Quentin (SUPTEM-BMHS) ~Tanger 2013-2015 Master en Finance; Audit et Contrôle de Gestion L'Ecole Supérieure des Sciences Techniques et de Management (SUPTEM-BMHS) ~Tanger 2010-2013 Licence en Management L'Ecole Supérieure des Sciences Techniques et de Management (SUPTEM-BMHS) ~Tanger 2009-2010 Baccalauréat en sciences économiques Lycée MOULAY RACHID, Chefchaouen. Expérience professionnelle 2018/Aujourdhui Chef de Service Achat au sein dACOME MAROC Tanger ~Gérer, optimiser Pachat et lapprovisionnement, en vue dobtenir les meilleures conditions -Traiter des demandes dachat. ~Lancer des appels doffres auprès des fournisseurs: ~Réaliser des études financières et techniques des offres. ~Evaluer les propositions des fournisseurs (Benchmark) ~Gérer le portefeuille fournisseur (locaux et étrangers). ~Passer les commandes et assurer le suivi des livraisons. ~Garantir Pinterface clients internes et fournisseurs. ~Suivre les contrats (qualité, délais; livraison; paiement) en lien avec les différents intervenants (fournisseurs, autres services internes). ~Résoudre les éventuels litiges commerciaux et financiers avec les fournisseurs. ~Assurer une veille sur le marché. -Assurer le suivi des indicateurs et Pélaboration des reportings mensuels. 2017/2018 Stage de perfection de 7 mois au sein dACOME MAROC _ Tanger ~Participer aux travaux dinventaire ~Assurer la comptabilisation des factures ~Elaborer les Reportings du CA hebdomadaires ~Participer à Pélaboration du FOND HASSAN 2 ~Préparer les virements ~Assurer la facturation 2015/2016 ~Stage de fin détude de trois mois au sein dELTOROTRANS SAR - Tanger ~Optimiser la fonction achat dans la logistique automobile au niveau de Tanger 2014/2015 Stage dapplication de deux mois au sein de LEAR AS- Tanger ~Auditer et réaliser le contrôle interne du achat 2012/2013 Stage de fin détude de deux mois au sein d'Attijariwafa Bank ~Réaliser une étude de satisfaction des clients de Pagence Rue de Belgique Compétences_Techniques_ ~Techniques d'achats Techniques de négociation ~Normes et procédures achats ~Audit interne Compétences informatiques Bureautique: Pack Office SAP MS Project_ sphinx - Sage comptabilité 100 MFGPRO- GANTT project. Compétences linguistiques Arabe; Français, Anglais et EspagnoL. Autres renseignements personnels Loisirs sport (basket-ball, natation; musculation) voyages. Esprit de travail en équipe et esprit associatif. Réalisation de divers projets au des étudiants de SUPTEM cycle profit
    """
    
    # Test the parser
    parser = GroqCVParser()
    result = parser.parse_cv_text(sample_text)
    
    print("🧠 RÉSULTAT DE L'EXTRACTION JSON:")
    print("=" * 50)
    
    if result['success']:
        print("✅ Extraction réussie!")
        print(json.dumps(result['data'], indent=2, ensure_ascii=False))
    else:
        print("❌ Erreur lors de l'extraction:")
        print(result['error'])
        if 'raw_response' in result:
            print("\nRéponse brute:")
            print(result['raw_response'])