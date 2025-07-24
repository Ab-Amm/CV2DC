import os
import json
import logging
import requests
import time
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Load environment variables from .env file
load_dotenv()
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiCVParser:
    """Parser to extract structured JSON from CV text using Gemini AI API"""
    def __init__(self, api_key: str = None):
        """Initialize the Gemini AI parser with API key"""
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        
        # Configuration pour la gestion des timeouts et retries
        self.max_retries = 3
        self.retry_delay = 2  # secondes
        self.timeout_stages = [60, 90, 120]  # timeouts progressifs
        
        if not self.api_key:
            raise ValueError("Gemini API key is required. Set GEMINI_API_KEY environment variable.")
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            "Content-Type": "application/json",
            "User-Agent": "CV-Parser/1.0"
        }
    
    def create_session(self) -> requests.Session:
        """Create a configured requests session with retry strategy"""
        session = requests.Session()
        
        # Configuration de la stratégie de retry pour les erreurs de connexion
        retry_strategy = Retry(
            total=0,  # Nous gérons les retries manuellement
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        
        adapter = HTTPAdapter(
            max_retries=retry_strategy,
            pool_connections=1,
            pool_maxsize=1
        )
        
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        session.headers.update(self.get_headers())
        
        return session
        
    def create_structuring_prompt(self, extracted_text: str) -> str:
        """Create the prompt for structuring CV text"""
        prompt = f"""Vous êtes un spécialiste de l'extraction de données chargé de convertir du texte non structuré provenant d'un PDF en un format JSON structuré. Votre objectif est d'extraire avec précision et de normaliser les informations professionnelles pertinentes.
        ---
        ### Entrée :
        \"\"\"{extracted_text}\"\"\"
        ### Sortie :
        Retournez uniquement un objet JSON valide, sans commentaires ni explications, au format suivant :
        {{
        "nom": "",                          // Format : initiale du prénom + ". " + trois premières lettres du nom de famille (ex. : "S. CHA" pour Soufiane Chaker)
        "titre": "",                        // Générez un titre basé sur l'ensemble des informations du CV
        "competences": {{
            "langages_programmation": [],     // ex. : "Python", "Java"
            "logiciels_techniques": [],       // ex. : "AutoCAD", "Tableau"
            "competences_generales": [],      // ex. : "Communication", "Résolution de problèmes"
            "competences_manageriales": []    // ex. : "Leadership", "Gestion d'équipe"
        }},
        "experience_professionnelle": [     
            {{
            "titre_poste": "",              // Titre principal du poste occupé dans l'entreprise
            "entreprise": "",               // Nom de l'entreprise employeuse (pas le client final)
            "periode": "",                  // Durée ou période globale dans l'entreprise
            "missions": [                   // Liste des missions/projets réalisés
                {{
                "titre_mission": "",        // Titre de la mission/projet (inclure le nom du client si mentionné, ex: "Développement application mobile pour Toyota")
                "client": "",               // Nom du client final (si différent de l'entreprise, laisser vide sinon)
                "periode_mission": "",      // Période spécifique de cette mission (si différente de la période globale, laisser vide sinon)
                "description": []           // Liste des responsabilités/tâches pour cette mission spécifique
                }}
            ]
            }}
        ],
        "formation": [
            {{
            "diplome": "",
            "etablissement": "",
            "dates": ""
            }}
        ],
        "langues": []                       // ex. : "Français – Courant", "Anglais – Intermédiaire"
        }}
        
        ### Règles pour l'extraction des expériences professionnelles :
        1. **Entreprise vs Client** : Distinguez l'entreprise employeuse du client final
           - Entreprise : société qui emploie la personne
           - Client : entreprise finale pour laquelle le service est rendu (souvent précédé de "pour", "chez", "mission")
        
        2. **Structuration des missions** :
           - Si une expérience contient plusieurs projets/missions : créez une mission séparée pour chaque projet
           - Si plusieurs clients sont mentionnés : créez une mission par client
           - Si un seul projet global : créez une seule mission
        
        3. **Gestion des prestations** :
           - Pour les consultants/prestataires : l'entreprise reste la société de conseil, le client est l'entreprise finale
           - Titre mission : "Mission de [type] pour [client]" ou similaire
        
        4. **Regroupement logique** :
           - Groupez les tâches par mission/projet logique
           - Évitez de mélanger les responsabilités de différents clients dans une même mission
        
        5. **Périodes** :
           - Période globale : durée totale dans l'entreprise
           - Période mission : durée spécifique du projet (uniquement si différente et précisée)
        
        ### Règles supplémentaires :
        1. Supprimez toute section introductive comme "Profil", "Profil professionnel", etc.
        2. Si une section intitulée "Compétences professionnelles" est présente, retournez un objet JSON additionnel :
        {{
        "competences_professionnelles": []
        }}
        3. Si une section "Certifications" ou équivalente est trouvée, retournez un objet JSON additionnel :
        {{
        "certifications": []
        }}
        4. N'incluez ces objets que si les sections existent explicitement dans le texte d'entrée.
        5. Le résultat doit être un JSON 100 % valide. N'incluez aucun commentaire, balise, ou texte extérieur.
        """
    
        return prompt
    
    def extract_json_from_text(self, text: str) -> str:
        """Extract and parse the JSON object from a text response."""
        start_index = text.find('{')
        end_index = text.rfind('}') + 1  # Find the last closing brace

        if start_index == -1 or end_index == -1:
            raise ValueError("JSON object not found or incomplete.")

        json_str = text[start_index:end_index]

        try:
            # Valider que le JSON est bien formé
            json.loads(json_str)
            return json_str
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON parsing failed: {e}")
    
    def make_api_request(self, payload: Dict[str, Any], timeout: int, model: str) -> requests.Response:
        """Make API request with proper session management"""
        session = self.create_session()
        try:
            # URL complète avec la clé API
            url = f"{self.base_url}/{model}:generateContent?key={self.api_key}"
            
            response = session.post(
                url,
                json=payload,
                timeout=timeout
            )
            return response
        finally:
            session.close()
    
    def parse_cv_text(self, extracted_text: str, model: str = "gemini-1.5-pro") -> Dict[str, Any]:
        """Parse CV text using Gemini API with retry logic and better error handling"""
        
        # Truncate text if needed
        processed_text = extracted_text
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Tentative {attempt + 1}/{self.max_retries}: Envoi du CV à Gemini...")
                
                # Create prompt
                prompt = self.create_structuring_prompt(processed_text)
                
                # Prepare request payload for Gemini API
                payload = {
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.1,
                        "topK": 40,
                        "topP": 0.8,
                        "maxOutputTokens": 8500,
                        "candidateCount": 1,
                        "stopSequences": []
                    },
                    "safetySettings": [
                        {
                            "category": "HARM_CATEGORY_HARASSMENT",
                            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            "category": "HARM_CATEGORY_HATE_SPEECH",
                            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                }
                
                # Use progressive timeout
                timeout = self.timeout_stages[min(attempt, len(self.timeout_stages) - 1)]
                logger.info(f"Timeout défini à {timeout} secondes pour la tentative {attempt + 1}")
                
                # Make request
                response = self.make_api_request(payload, timeout, model)
                response.raise_for_status()
                
                # Extract response
                response_data = response.json()
                
                # Vérifier si la réponse contient du contenu
                if 'candidates' not in response_data or not response_data['candidates']:
                    raise ValueError("Aucun contenu généré par Gemini")
                
                candidate = response_data['candidates'][0]
                
                # Vérifier si le contenu a été bloqué
                if 'content' not in candidate:
                    if 'finishReason' in candidate and candidate['finishReason'] == 'SAFETY':
                        raise ValueError("Contenu bloqué par les filtres de sécurité")
                    else:
                        raise ValueError("Aucun contenu dans la réponse")
                
                raw_response = candidate['content']['parts'][0]['text'].strip()
                
                logger.info("Réponse reçue de Gemini")
                logger.debug(f"Réponse brute (premiers 200 chars): {raw_response[:200]}...")
                
                # Extract JSON from response
                json_str = self.extract_json_from_text(raw_response)
                logger.info("JSON extrait de la réponse Gemini")
                
                # Parse JSON
                try:
                    structured_data = json.loads(json_str)
                    logger.info("Parsing JSON réussi")
                    
                    # Calculer l'usage approximatif des tokens
                    usage_info = {
                        'promptTokenCount': response_data.get('usageMetadata', {}).get('promptTokenCount', 0),
                        'candidatesTokenCount': response_data.get('usageMetadata', {}).get('candidatesTokenCount', 0),
                        'totalTokenCount': response_data.get('usageMetadata', {}).get('totalTokenCount', 0)
                    }
                    
                    return {
                        'success': True,
                        'data': structured_data,
                        'raw_response': raw_response,
                        'model_used': model,
                        'token_usage': usage_info,
                        'attempts': attempt + 1,
                        'text_truncated': len(processed_text) < len(extracted_text)
                    }
                except json.JSONDecodeError as e:
                    logger.error(f"Erreur de parsing JSON: {e}")
                    if attempt == self.max_retries - 1:
                        return {
                            'success': False,
                            'error': f'JSON invalide après {self.max_retries} tentatives: {str(e)}',
                            'raw_response': raw_response,
                            'model_used': model,
                            'attempts': attempt + 1
                        }
                    continue
                    
            except requests.exceptions.Timeout as e:
                logger.warning(f"Timeout sur la tentative {attempt + 1}: {e}")
                if attempt == self.max_retries - 1:
                    return {
                        'success': False,
                        'error': f'Timeout après {self.max_retries} tentatives. Essayez avec un texte plus court.',
                        'attempts': attempt + 1
                    }
                # Attendre avant retry
                time.sleep(self.retry_delay * (attempt + 1))
                
            except requests.exceptions.ConnectionError as e:
                logger.warning(f"Erreur de connexion sur la tentative {attempt + 1}: {e}")
                if attempt == self.max_retries - 1:
                    return {
                        'success': False,
                        'error': f'Connexion échouée après {self.max_retries} tentatives. Vérifiez votre connexion internet.',
                        'attempts': attempt + 1
                    }
                time.sleep(self.retry_delay * (attempt + 1))
                
            except requests.exceptions.HTTPError as e:
                logger.error(f"Erreur HTTP sur la tentative {attempt + 1}: {e}")
                if e.response.status_code == 429:  # Rate limit
                    if attempt == self.max_retries - 1:
                        return {
                            'success': False,
                            'error': 'Limite de taux dépassée. Réessayez plus tard.',
                            'attempts': attempt + 1
                        }
                    time.sleep(self.retry_delay * (attempt + 1) * 2)
                elif e.response.status_code >= 500:  # Server errors
                    if attempt == self.max_retries - 1:
                        return {
                            'success': False,
                            'error': f'Erreur serveur: {e.response.status_code}',
                            'attempts': attempt + 1
                        }
                    time.sleep(self.retry_delay * (attempt + 1))
                else:
                    return {
                        'success': False,
                        'error': f'Erreur API: {e.response.status_code} - {e.response.text}',
                        'attempts': attempt + 1
                    }
                    
            except Exception as e:
                logger.error(f"Erreur inattendue sur la tentative {attempt + 1}: {e}")
                if attempt == self.max_retries - 1:
                    return {
                        'success': False,
                        'error': f'Erreur inattendue après {self.max_retries} tentatives: {str(e)}',
                        'attempts': attempt + 1
                    }
                time.sleep(self.retry_delay * (attempt + 1))
        
        return {
            'success': False,
            'error': 'Nombre maximum de tentatives dépassé',
            'attempts': self.max_retries
        }
    
    def parse_cv_with_fallback(self, extracted_text: str) -> Dict[str, Any]:
        """Parse CV with fallback to different models if primary fails"""
        # Modèles de fallback Gemini
        fallback_models = [
            "gemini-1.5-flash",
            "gemini-1.0-pro"
        ]
        
        # Essayer le modèle principal d'abord
        result = self.parse_cv_text(extracted_text)
        if result['success']:
            return result
            
        logger.info("Échec du modèle principal, essai des modèles de fallback...")
        
        # Essayer les modèles de fallback
        for model in fallback_models:
            try:
                logger.info(f"Essai du modèle de fallback: {model}")
                result = self.parse_cv_text(extracted_text, model=model)
                if result['success']:
                    result['used_fallback'] = True
                    result['fallback_model'] = model
                    return result
            except Exception as e:
                logger.warning(f"Échec du modèle de fallback {model}: {e}")
                continue
        
        # Si tout échoue, retourner une structure basique
        return {
            'success': False,
            'error': 'Toutes les méthodes de parsing ont échoué',
            'fallback_data': {
                'nom': 'Extraction échouée',
                'titre': 'Analyse manuelle requise',
                'competences': {
                    'langages_programmation': [],
                    'logiciels_techniques': [],
                    'competences_generales': [],
                    'competences_manageriales': []
                },
                'experience_professionnelle': [],
                'formation': [],
                'langues': [],
                'raw_text': extracted_text[:1000] + "..." if len(extracted_text) > 1000 else extracted_text
            }
        }
    
    def format_cv_json(self, data: Dict[str, Any]) -> str:
        """Format the parsed CV data as pretty JSON"""
        if data.get('success'):
            return json.dumps(data['data'], indent=2, ensure_ascii=False)
        else:
            return json.dumps(data, indent=2, ensure_ascii=False)

    def format_cv_data(self, data: Dict[str, Any]) -> str:
        """Format CV data as JSON string - coordinated method for Flask app"""
        return self.format_cv_json(data)

# Standalone functions for easy integration
def parse_cv_with_gemini(extracted_text: str, api_key: str = None, model: str = "gemini-1.5-pro") -> Dict[str, Any]:
    """Parse CV text using Gemini API - standalone function with retry logic"""
    parser = GeminiCVParser(api_key)
    return parser.parse_cv_with_fallback(extracted_text)

def format_cv_data(data: Dict[str, Any]) -> str:
    """Format CV data as JSON string - standalone function"""
    if not data:
        return "{}"
    
    if data.get('success'):
        return json.dumps(data['data'], indent=2, ensure_ascii=False)
    else:
        return json.dumps(data, indent=2, ensure_ascii=False)

# Available Gemini models
AVAILABLE_MODELS = {
    "gemini-1.5-pro": "gemini-1.5-pro",           # Most capable model, 2M tokens context
    "gemini-1.5-flash": "gemini-1.5-flash",       # Faster model, 1M tokens context
    "gemini-1.0-pro": "gemini-1.0-pro"            # Standard model, 32k tokens context
}

def get_model_info():
    """Get information about available models"""
    return AVAILABLE_MODELS