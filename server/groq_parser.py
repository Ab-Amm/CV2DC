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
        "titre": "",                        // Generate it based on the overall information at hand if not found in the text
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
            "description": ""               // All Tasks or responsibilities, into bullet points
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
    
    def extract_json_from_text(self,text: str) -> str:
        """Extract and parse the JSON object from a text response."""
        start_index = text.find('{')
        end_index = text.rfind('}') + 1  # Find the last closing brace

        if start_index == -1 or end_index == -1:
            raise ValueError("JSON object not found or incomplete.")

        json_str = text[start_index:end_index]

        try:
            return json_str
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON parsing failed: {e}")
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
            logger.info("Groq raw Response: " + raw_response)
            # Extract JSON from response
            json_str = self.extract_json_from_text(raw_response)
            logger.info("Extracted JSON from Groq response")
            logger.info("Groq JSON Response: " + json_str)
            
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

    def format_cv_data(self, data: Dict[str, Any]) -> str:
        """Format CV data as JSON string - coordinated method for Flask app"""
        return self.format_cv_json(data)

# Standalone functions for easy integration
def parse_cv_with_groq(extracted_text: str, api_key: str = None) -> Dict[str, Any]:
    """Parse CV text using Groq API - standalone function"""
    parser = GroqCVParser(api_key)
    return parser.parse_cv_text(extracted_text)

def format_cv_data(data: Dict[str, Any]) -> str:
    """Format CV data as JSON string - standalone function"""
    parser = GroqCVParser()
    return parser.format_cv_json(data)
