from flask import Flask, request, jsonify, render_template_string
import easyocr
import cv2
import numpy as np
from pdf2image import convert_from_path
from PIL import Image
import os
import io
import base64
from werkzeug.utils import secure_filename
import tempfile
import logging
from datetime import datetime
from groq_parser import GroqCVParser
from flask_cors import CORS
from flask_cors import CORS
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
load_dotenv()


app = Flask(__name__)
app.debug = True
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

def convert_numpy(obj):
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(v) for v in obj]
    elif isinstance(obj, (np.integer, np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize EasyOCR reader and Groq parser globally
reader = None
cv_parser = None

def initialize_ocr():
    """Initialize EasyOCR reader and Groq parser"""
    global reader, cv_parser
    if reader is None:
        logger.info("Initializing EasyOCR...")
        reader = easyocr.Reader(['en', 'fr'], gpu=False)  # Set gpu=True if available
        logger.info("EasyOCR initialized successfully")
    
    if cv_parser is None:
        logger.info("Initializing Groq parser...")
        cv_parser = GroqCVParser()
        logger.info("Groq parser initialized successfully")

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def pdf_to_images(pdf_path, dpi=300):
    """Convert PDF to images"""
    try:
        logger.info(f"Converting PDF to images: {pdf_path}")
        images = convert_from_path(pdf_path, 
                                   dpi=dpi, 
                                   poppler_path=os.getenv("POPPLER_PATH"))
        logger.info(f"Successfully converted {len(images)} page(s)")
        return images
    except Exception as e:
        logger.error(f"Error converting PDF: {e}")
        return None

def preprocess_image(image):
    """Preprocess image for better OCR"""
    try:
        # Convert PIL to OpenCV
        img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # Enhance contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(enhanced)
        
        # Resize if too large
        height, width = denoised.shape
        if width > 2000:
            scale = 2000 / width
            new_width = int(width * scale)
            new_height = int(height * scale)
            denoised = cv2.resize(denoised, (new_width, new_height))
        
        return denoised
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        return None

def extract_text_with_easyocr(image, confidence_threshold=0.5):
    """Extract text using EasyOCR"""
    try:
        global reader
        if reader is None:
            initialize_ocr()
        
        logger.info("Extracting text with EasyOCR...")
        results = reader.readtext(image, detail=1)
        
        # Filter results by confidence
        filtered_results = [
            (bbox, text, confidence) 
            for bbox, text, confidence in results 
            if confidence > confidence_threshold
        ]
        
        return filtered_results
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        return []

def format_extracted_text(results):
    """Format extracted text"""
    extracted_text = []
    
    for bbox, text, confidence in results:
        extracted_text.append({
            'text': text,
            'confidence': confidence,
            'bbox': bbox
        })
    
    full_text = ' '.join([item['text'] for item in extracted_text])
    
    return {
        'full_text': full_text,
        'segments': extracted_text,
        'total_segments': len(extracted_text),
        'total_characters': len(full_text),
        'total_words': len(full_text.split())
    }

def process_cv_pdf(pdf_path, parse_with_groq=True):
    """Main function to process CV PDF"""
    try:
        # Convert PDF to images
        images = pdf_to_images(pdf_path)
        
        if images is None:
            return {'error': 'Failed to convert PDF to images'}
        
        all_results = []
        all_text_segments = []
        
        # Process each page
        for i, image in enumerate(images):
            logger.info(f"Processing page {i+1}/{len(images)}")
            
            # Preprocess image
            processed_image = preprocess_image(image)
            
            if processed_image is None:
                logger.warning(f"Failed to preprocess page {i+1}")
                continue
            
            # Extract text
            results = extract_text_with_easyocr(processed_image)
            
            # Format results
            formatted_results = format_extracted_text(results)
            
            page_result = {
                'page': i + 1,
                'results': formatted_results
            }
            
            all_results.append(page_result)
            all_text_segments.extend(formatted_results['segments'])
        
        # Combine all text
        final_text = ' '.join([segment['text'] for segment in all_text_segments])
        
        response_data = {
            'success': True,
            'pages': all_results,
            'summary': {
                'total_pages': len(images),
                'total_segments': len(all_text_segments),
                'total_characters': len(final_text),
                'total_words': len(final_text.split()),
                'full_text': final_text
            }
        }
        
        # Parse with Groq if requested
        if parse_with_groq and final_text.strip():
            global cv_parser
            if cv_parser is None:
                initialize_ocr()  # This will also initialize cv_parser
            
            logger.info("Parsing CV with Groq...")
            groq_result = cv_parser.parse_cv_text(final_text)
            response_data['groq_parsing'] = groq_result
            
            if groq_result['success']:
                response_data['structured_cv'] = groq_result['data']
                # Use the coordinated format_cv_data method
                response_data['formatted_cv'] = cv_parser.format_cv_data(groq_result)
                logger.info("Successfully formatted CV data for display")
            else:
                logger.error(f"Groq parsing failed: {groq_result.get('error', 'Unknown error')}")
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
        return {'error': str(e)}

@app.route('/process', methods=['POST'])
def process_pdf():
    """Process uploaded PDF file"""
    logger.info("Processing PDF...")
    try:
        # Check if file is uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Process the PDF
            result = process_cv_pdf(filepath, parse_with_groq=True)
            
            # Clean up uploaded file
            os.remove(filepath)
            
            return jsonify(convert_numpy(result))
            
        except Exception as e:
            # Clean up uploaded file in case of error
            if os.path.exists(filepath):
                os.remove(filepath)
            raise e
            
    except Exception as e:
        logger.error(f"Error in process_pdf: {e}")
        return jsonify({'error': str(e)}), 500
    

@app.route('/DC', methods=['POST'])
def process_dc():
    try:
        logger.info("Processing data /DC...")
        data = request.get_json()
        if not data or "structured_cv" not in data:
            return jsonify({'error': 'Missing structured_cv in request'}), 400
        
        logger.info("Generating PDF...")
        
        structured_data = data["structured_cv"]
        env = Environment(loader=FileSystemLoader('./static'))
        template = env.get_template('template.html')

        logger.info("Rendering template... ", template)
        # Render template
        html_out = template.render(data=structured_data)

        logger.info("PDF generated successfully")

        # Create a safe filename
        name = structured_data.get("nom", "unknown").replace(" ", "_")
        pdf_filename = f"{name}_resume_dc.pdf"
        pdf_path = os.path.join('.', 'static', 'output',  pdf_filename)  # Save in static so it can be served if needed

        logger.info(f"Saving PDF to {pdf_path}")

        # Generate PDF
        HTML(string=html_out).write_pdf(pdf_path)

        logger.info(f"PDF saved to {pdf_path}")

        # Optional: encode as base64 to return via JSON
        with open(pdf_path, 'rb') as f:
            encoded_pdf = base64.b64encode(f.read()).decode('utf-8')

        logger.info("PDF encoded as base64")

        return jsonify({
            'message': 'PDF generated successfully',
            'pdf_filename': pdf_filename,
            'pdf_base64': encoded_pdf
        })

    except Exception as e:
        logger.error(f"Error in /DC endpoint: {e}")
        return jsonify({'error': str(e)}), 500
    

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Initialize OCR on startup
    initialize_ocr()
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
