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

# HTML template for the upload form - Updated to better show formatted data
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>CV PDF Text Extractor</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .container { background: #f5f5f5; padding: 20px; border-radius: 10px; }
        .result { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .error { background: #ffebee; color: #c62828; }
        .success { background: #e8f5e8; color: #2e7d32; }
        .loading { text-align: center; padding: 20px; }
        textarea { width: 100%; height: 200px; margin: 10px 0; font-family: monospace; }
        .stats { background: #e3f2fd; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .formatted-cv { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .structured-cv { background: #f1f8ff; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-size: 12px; }
        .section-title { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; margin-bottom: 10px; }
        .json-container { max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📄 CV PDF Text Extractor</h1>
        <p>Upload a PDF file to extract text using EasyOCR and parse with Groq AI</p>
        
        <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" id="pdfFile" name="file" accept=".pdf" required>
            <label>
                <input type="checkbox" id="parseWithGroq" name="parse_with_groq" checked>
                Parse with Groq AI for structured JSON
            </label>
            <button type="submit">Extract Text</button>
        </form>
        
        <div id="loading" class="loading" style="display: none;">
            <p>🔄 Processing PDF... This may take a few minutes.</p>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fileInput = document.getElementById('pdfFile');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select a PDF file');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('parse_with_groq', document.getElementById('parseWithGroq').checked);
            
            document.getElementById('loading').style.display = 'block';
            document.getElementById('result').innerHTML = '';
            
            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                document.getElementById('loading').style.display = 'none';
                
                if (data.success) {
                    displayResults(data);
                } else {
                    displayError(data.error);
                }
                
            } catch (error) {
                document.getElementById('loading').style.display = 'none';
                displayError('Error: ' + error.message);
            }
        });
        
        function displayResults(data) {
            const resultDiv = document.getElementById('result');
            
            let html = '<div class="result success">';
            html += '<h3>✅ Text Extraction Completed</h3>';
            
            html += '<div class="stats">';
            html += '<h4>📊 Summary:</h4>';
            html += '<p><strong>Pages processed:</strong> ' + data.summary.total_pages + '</p>';
            html += '<p><strong>Text segments:</strong> ' + data.summary.total_segments + '</p>';
            html += '<p><strong>Characters:</strong> ' + data.summary.total_characters + '</p>';
            html += '<p><strong>Words:</strong> ' + data.summary.total_words + '</p>';
            html += '</div>';
            
            // Show Groq parsing status
            if (data.groq_parsing) {
                if (data.groq_parsing.success) {
                    html += '<div class="result success">';
                    html += '<h3>🧠 Groq AI Parsing: ✅ Success</h3>';
                    html += '</div>';
                } else {
                    html += '<div class="result error">';
                    html += '<h3>🧠 Groq AI Parsing: ❌ Failed</h3>';
                    html += '<p>Error: ' + data.groq_parsing.error + '</p>';
                    html += '</div>';
                }
            }
            
            // Show formatted CV if available
            if (data.formatted_cv) {
                html += '<div class="result formatted-cv">';
                html += '<h3 class="section-title">📋 Formatted CV Data</h3>';
                html += '<div class="json-container">';
                html += '<pre>' + data.formatted_cv + '</pre>';
                html += '</div>';
                html += '</div>';
            }
            
            // Show structured CV if available
            if (data.structured_cv) {
                html += '<div class="result structured-cv">';
                html += '<h3 class="section-title">🔧 Structured CV (Raw JSON)</h3>';
                html += '<div class="json-container">';
                html += '<pre>' + JSON.stringify(data.structured_cv, null, 2) + '</pre>';
                html += '</div>';
                html += '</div>';
            }
            
            html += '<div class="result">';
            html += '<h4 class="section-title">📖 Raw Extracted Text:</h4>';
            html += '<textarea readonly>' + data.summary.full_text + '</textarea>';
            html += '</div>';
            
            html += '<div class="result">';
            html += '<h4 class="section-title">📄 Page Details:</h4>';
            data.pages.forEach(page => {
                html += '<div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">';
                html += '<h5>Page ' + page.page + ' (' + page.results.total_segments + ' segments)</h5>';
                html += '<p style="font-size: 12px; color: #666;">' + page.results.full_text + '</p>';
                html += '</div>';
            });
            html += '</div>';
            
            html += '</div>';
            
            resultDiv.innerHTML = html;
        }
        
        function displayError(error) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="result error"><h3>❌ Error</h3><p>' + error + '</p></div>';
        }
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    """Home page with upload form"""
    return render_template_string(HTML_TEMPLATE)



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

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Initialize OCR on startup
    initialize_ocr()
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
