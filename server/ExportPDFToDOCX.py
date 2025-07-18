import os
import logging
import requests
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from adobe.pdfservices.operation.auth.service_principal_credentials import ServicePrincipalCredentials
from adobe.pdfservices.operation.pdf_services import PDFServices
from adobe.pdfservices.operation.pdf_services_media_type import PDFServicesMediaType
from adobe.pdfservices.operation.io.cloud_asset import CloudAsset
from adobe.pdfservices.operation.io.stream_asset import StreamAsset
from adobe.pdfservices.operation.exception.exceptions import ServiceApiException, ServiceUsageException, SdkException

# Adobe PDF Services imports
from adobe.pdfservices.operation.pdfjobs.jobs.export_pdf_job import ExportPDFJob
from adobe.pdfservices.operation.pdfjobs.params.export_pdf.export_pdf_params import ExportPDFParams
from adobe.pdfservices.operation.pdfjobs.params.export_pdf.export_pdf_target_format import ExportPDFTargetFormat
from adobe.pdfservices.operation.pdfjobs.result.export_pdf_result import ExportPDFResult

app = Flask(__name__)
logger = logging.getLogger(__name__)

class ExportPDFToDOCX:
    def __init__(self):
        # Initial setup, create credentials instance
        self.credentials = ServicePrincipalCredentials(
            client_id=os.getenv('PDF_SERVICES_CLIENT_ID'),
            client_secret=os.getenv('PDF_SERVICES_CLIENT_SECRET')
        )
        # Create PDFServices instance
        self.pdf_services = PDFServices(credentials=self.credentials)
    
    def convert_pdf_to_docx(self, pdf_url: str, output_path: str = None) -> str:
        """
        Converts a PDF from a URL to DOCX and saves it locally.
        Returns the output file path.
        """
        try:
            # Download the PDF
            logging.info(f"Downloading PDF from URL: {pdf_url}")
            response = requests.get(pdf_url, timeout=30)
            response.raise_for_status()
            
            # Upload the PDF to Adobe service
            input_asset = self.pdf_services.upload(
                input_stream=response.content,
                mime_type=PDFServicesMediaType.PDF
            )
            
            # Define export parameters (PDF → DOCX)
            export_pdf_params = ExportPDFParams(target_format=ExportPDFTargetFormat.DOCX)
            export_pdf_job = ExportPDFJob(input_asset=input_asset, export_pdf_params=export_pdf_params)
            
            # Submit the job
            location = self.pdf_services.submit(export_pdf_job)
            pdf_services_response = self.pdf_services.get_job_result(location, ExportPDFResult)
            
            # Retrieve resulting asset
            result_asset: CloudAsset = pdf_services_response.get_result().get_asset()
            stream_asset: StreamAsset = self.pdf_services.get_content(result_asset)
            
            # Define output path
            if not output_path:
                output_path = self.create_output_file_path()
            
            # Write the file
            with open(output_path, "wb") as file:
                file.write(stream_asset.get_input_stream())
            
            logging.info(f"Successfully saved DOCX to {output_path}")
            return output_path
        
        except (ServiceApiException, ServiceUsageException, SdkException, requests.RequestException) as e:
            logging.exception(f"Exception encountered during PDF to DOCX conversion: {e}")
            raise
    
    def convert_pdf_file_to_docx(self, pdf_file_path: str, output_path: str = None) -> str:
        """
        Converts a PDF file to DOCX and saves it locally.
        Returns the output file path.
        """
        try:
            # Read the PDF file
            logging.info(f"Reading PDF file: {pdf_file_path}")
            with open(pdf_file_path, 'rb') as file:
                pdf_content = file.read()
            
            # Upload the PDF to Adobe service
            input_asset = self.pdf_services.upload(
                input_stream=pdf_content,
                mime_type=PDFServicesMediaType.PDF
            )
            
            # Define export parameters (PDF → DOCX)
            export_pdf_params = ExportPDFParams(target_format=ExportPDFTargetFormat.DOCX)
            export_pdf_job = ExportPDFJob(input_asset=input_asset, export_pdf_params=export_pdf_params)
            
            # Submit the job
            location = self.pdf_services.submit(export_pdf_job)
            pdf_services_response = self.pdf_services.get_job_result(location, ExportPDFResult)
            
            # Retrieve resulting asset
            result_asset: CloudAsset = pdf_services_response.get_result().get_asset()
            stream_asset: StreamAsset = self.pdf_services.get_content(result_asset)
            
            # Define output path
            if not output_path:
                output_path = self.create_output_file_path()
            
            # Write the file
            with open(output_path, "wb") as file:
                file.write(stream_asset.get_input_stream())
            
            logging.info(f"Successfully saved DOCX to {output_path}")
            return output_path
        
        except (ServiceApiException, ServiceUsageException, SdkException) as e:
            logging.exception(f"Exception encountered during PDF to DOCX conversion: {e}")
            raise
    
    @staticmethod
    def create_output_file_path() -> str:
        now = datetime.now()
        time_stamp = now.strftime("%Y-%m-%dT%H-%M-%S")
        os.makedirs("output/ExportPDFToDOCX", exist_ok=True)
        return f"output/ExportPDFToDOCX/export_{time_stamp}.docx"