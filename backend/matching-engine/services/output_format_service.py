"""
Comprehensive Output Format Service for IDXR
Supports multiple output formats and destinations
"""

import asyncio
import json
import pandas as pd
import csv
import io
import openpyxl
import xml.etree.ElementTree as ET
import smtplib
import boto3
import pyodbc
import mysql.connector
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from enum import Enum
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
import logging
from pathlib import Path
import yaml
import gzip
import zipfile
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import requests
from jinja2 import Template
import pyarrow as pa
import pyarrow.parquet as pq
from sqlalchemy import create_engine

from utils.logger import setup_logger

logger = setup_logger("output_format_service")

class OutputFormat(Enum):
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    PARQUET = "parquet"
    JSONL = "jsonl"
    XML = "xml"
    HTML_REPORT = "html_report"
    PDF_REPORT = "pdf_report"
    DATABASE = "database"
    API_WEBHOOK = "api_webhook"
    EMAIL_REPORT = "email_report"
    S3_EXPORT = "s3_export"
    FTP_EXPORT = "ftp_export"
    DASHBOARD = "dashboard"
    KAFKA_STREAM = "kafka_stream"

class CompressionFormat(Enum):
    NONE = "none"
    GZIP = "gzip"
    ZIP = "zip"
    BZIP2 = "bzip2"

@dataclass
class OutputConfig:
    format: OutputFormat
    destination: str
    config: Dict[str, Any]
    filename_template: Optional[str] = None
    compression: Optional[CompressionFormat] = None
    encryption: Optional[Dict[str, str]] = None
    notification: Optional[Dict[str, Any]] = None

class OutputHandler(ABC):
    """Abstract base class for all output handlers"""
    
    def __init__(self, config: OutputConfig):
        self.config = config
        self.logger = logger
    
    @abstractmethod
    async def validate_destination(self) -> Dict[str, Any]:
        """Validate the output destination"""
        pass
    
    @abstractmethod
    async def write_data(self, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Write data to the destination"""
        pass
    
    def generate_filename(self, base_name: str = "output", extension: str = "") -> str:
        """Generate filename using template"""
        if self.config.filename_template:
            template = Template(self.config.filename_template)
            return template.render(
                timestamp=datetime.now(),
                date=datetime.now().strftime("%Y%m%d"),
                time=datetime.now().strftime("%H%M%S"),
                base_name=base_name
            )
        else:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            return f"{base_name}_{timestamp}{extension}"

class CSVOutputHandler(OutputHandler):
    """Handler for CSV output format"""
    
    async def validate_destination(self) -> Dict[str, Any]:
        try:
            destination_path = Path(self.config.destination)
            destination_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Test write permission
            test_file = destination_path.parent / "test_write.tmp"
            test_file.touch()
            test_file.unlink()
            
            return {"valid": True, "path": str(destination_path)}
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def write_data(self, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            if not data:
                return {"success": False, "error": "No data to write"}
            
            filename = self.generate_filename("batch_results", ".csv")
            file_path = Path(self.config.destination) / filename
            
            # Convert to DataFrame for easier handling
            df = pd.DataFrame(data)
            
            # Apply any column mappings
            column_mapping = self.config.config.get('column_mapping', {})
            if column_mapping:
                df = df.rename(columns=column_mapping)
            
            # Filter columns if specified
            columns_to_include = self.config.config.get('columns', [])
            if columns_to_include:
                df = df[columns_to_include]
            
            # Write CSV with configuration options
            csv_options = {
                'index': self.config.config.get('include_index', False),
                'encoding': self.config.config.get('encoding', 'utf-8'),
                'sep': self.config.config.get('delimiter', ','),
                'quoting': csv.QUOTE_ALL if self.config.config.get('quote_all', False) else csv.QUOTE_MINIMAL
            }
            
            df.to_csv(file_path, **csv_options)
            
            # Apply compression if specified
            if self.config.compression and self.config.compression != CompressionFormat.NONE:
                compressed_path = await self._apply_compression(file_path)
                file_path.unlink()  # Remove original
                file_path = compressed_path
            
            file_info = {
                "success": True,
                "file_path": str(file_path),
                "file_size": file_path.stat().st_size,
                "record_count": len(data),
                "format": "csv"
            }
            
            # Add metadata if provided
            if metadata:
                file_info["metadata"] = metadata
            
            return file_info
            
        except Exception as e:
            self.logger.error(f"Error writing CSV: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _apply_compression(self, file_path: Path) -> Path:
        """Apply compression to the file"""
        if self.config.compression == CompressionFormat.GZIP:
            compressed_path = file_path.with_suffix(file_path.suffix + '.gz')
            with open(file_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    f_out.writelines(f_in)
            return compressed_path
        elif self.config.compression == CompressionFormat.ZIP:
            compressed_path = file_path.with_suffix('.zip')
            with zipfile.ZipFile(compressed_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                zipf.write(file_path, file_path.name)
            return compressed_path
        
        return file_path

class JSONOutputHandler(OutputHandler):
    """Handler for JSON output format"""
    
    async def validate_destination(self) -> Dict[str, Any]:
        try:
            destination_path = Path(self.config.destination)
            destination_path.parent.mkdir(parents=True, exist_ok=True)
            return {"valid": True, "path": str(destination_path)}
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def write_data(self, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            filename = self.generate_filename("batch_results", ".json")
            file_path = Path(self.config.destination) / filename
            
            # Prepare output structure
            output_data = {
                "metadata": metadata or {},
                "timestamp": datetime.now().isoformat(),
                "record_count": len(data),
                "results": data
            }
            
            # Write JSON with configuration options
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(
                    output_data,
                    f,
                    indent=self.config.config.get('indent', 2),
                    ensure_ascii=self.config.config.get('ensure_ascii', False),
                    default=str  # Handle datetime objects
                )
            
            return {
                "success": True,
                "file_path": str(file_path),
                "file_size": file_path.stat().st_size,
                "record_count": len(data),
                "format": "json"
            }
            
        except Exception as e:
            self.logger.error(f"Error writing JSON: {str(e)}")
            return {"success": False, "error": str(e)}

class ExcelOutputHandler(OutputHandler):
    """Handler for Excel output format"""
    
    async def validate_destination(self) -> Dict[str, Any]:
        try:
            destination_path = Path(self.config.destination)
            destination_path.parent.mkdir(parents=True, exist_ok=True)
            return {"valid": True, "path": str(destination_path)}
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def write_data(self, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            filename = self.generate_filename("batch_results", ".xlsx")
            file_path = Path(self.config.destination) / filename
            
            df = pd.DataFrame(data)
            
            # Create Excel writer with options
            excel_options = {
                'engine': 'openpyxl',
                'options': {
                    'strings_to_formulas': False,
                    'strings_to_urls': False
                }
            }
            
            with pd.ExcelWriter(file_path, **excel_options) as writer:
                # Write main data
                sheet_name = self.config.config.get('sheet_name', 'Results')
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                
                # Add metadata sheet if provided
                if metadata:
                    metadata_df = pd.DataFrame([metadata])
                    metadata_df.to_excel(writer, sheet_name='Metadata', index=False)
                
                # Add summary sheet
                summary_data = {
                    'Metric': ['Total Records', 'Export Date', 'Format'],
                    'Value': [len(data), datetime.now().strftime('%Y-%m-%d %H:%M:%S'), 'Excel']
                }
                summary_df = pd.DataFrame(summary_data)
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            return {
                "success": True,
                "file_path": str(file_path),
                "file_size": file_path.stat().st_size,
                "record_count": len(data),
                "format": "excel"
            }
            
        except Exception as e:
            self.logger.error(f"Error writing Excel: {str(e)}")
            return {"success": False, "error": str(e)}

class DatabaseOutputHandler(OutputHandler):
    """Handler for database output"""
    
    async def validate_destination(self) -> Dict[str, Any]:
        try:
            connection_string = self.config.config.get('connection_string')
            table_name = self.config.config.get('table_name')
            
            if not connection_string or not table_name:
                return {"valid": False, "error": "Missing connection_string or table_name"}
            
            # Test connection
            engine = create_engine(connection_string)
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            
            return {"valid": True, "table_name": table_name}
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def write_data(self, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            connection_string = self.config.config.get('connection_string')
            table_name = self.config.config.get('table_name')
            
            df = pd.DataFrame(data)
            
            # Add metadata columns if specified
            if metadata and self.config.config.get('include_metadata', False):
                for key, value in metadata.items():
                    df[f'meta_{key}'] = value
            
            # Add processing timestamp
            df['processed_at'] = datetime.now()
            
            engine = create_engine(connection_string)
            
            # Write to database
            write_mode = self.config.config.get('if_exists', 'append')  # append, replace, fail
            df.to_sql(
                table_name,
                engine,
                if_exists=write_mode,
                index=False,
                chunksize=self.config.config.get('chunksize', 1000)
            )
            
            return {
                "success": True,
                "table_name": table_name,
                "record_count": len(data),
                "write_mode": write_mode,
                "format": "database"
            }
            
        except Exception as e:
            self.logger.error(f"Error writing to database: {str(e)}")
            return {"success": False, "error": str(e)}

class WebhookOutputHandler(OutputHandler):
    """Handler for API webhook output"""
    
    async def validate_destination(self) -> Dict[str, Any]:
        try:
            url = self.config.config.get('url')
            if not url:
                return {"valid": False, "error": "Missing webhook URL"}
            
            # Test webhook with ping
            test_payload = {"test": "ping", "timestamp": datetime.now().isoformat()}
            headers = self.config.config.get('headers', {})
            
            response = requests.post(url, json=test_payload, headers=headers, timeout=30)
            
            return {
                "valid": True,
                "url": url,
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds()
            }
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def write_data(self, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            url = self.config.config.get('url')
            headers = self.config.config.get('headers', {})
            
            # Prepare payload
            payload = {
                "metadata": metadata or {},
                "timestamp": datetime.now().isoformat(),
                "record_count": len(data),
                "results": data
            }
            
            # Send data in batches if specified
            batch_size = self.config.config.get('batch_size', len(data))
            responses = []
            
            for i in range(0, len(data), batch_size):
                batch_data = data[i:i + batch_size]
                batch_payload = {
                    **payload,
                    "batch_number": (i // batch_size) + 1,
                    "results": batch_data
                }
                
                response = requests.post(url, json=batch_payload, headers=headers, timeout=60)
                response.raise_for_status()
                
                responses.append({
                    "batch": (i // batch_size) + 1,
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds()
                })
            
            return {
                "success": True,
                "url": url,
                "batches_sent": len(responses),
                "record_count": len(data),
                "responses": responses,
                "format": "webhook"
            }
            
        except Exception as e:
            self.logger.error(f"Error sending webhook: {str(e)}")
            return {"success": False, "error": str(e)}

class EmailOutputHandler(OutputHandler):
    """Handler for email report output"""
    
    async def validate_destination(self) -> Dict[str, Any]:
        try:
            smtp_config = self.config.config.get('smtp', {})
            recipients = self.config.config.get('recipients', [])
            
            if not smtp_config or not recipients:
                return {"valid": False, "error": "Missing SMTP configuration or recipients"}
            
            # Test SMTP connection
            server = smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587))
            server.starttls()
            server.login(smtp_config['username'], smtp_config['password'])
            server.quit()
            
            return {"valid": True, "recipients": recipients}
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def write_data(self, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            smtp_config = self.config.config.get('smtp', {})
            recipients = self.config.config.get('recipients', [])
            subject = self.config.config.get('subject', 'Batch Processing Results')
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = smtp_config['username']
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = subject
            
            # Create HTML report
            html_content = self._create_html_report(data, metadata)
            msg.attach(MIMEText(html_content, 'html'))
            
            # Attach CSV file if requested
            if self.config.config.get('attach_csv', True):
                csv_content = self._create_csv_attachment(data)
                attachment = MIMEBase('application', 'octet-stream')
                attachment.set_payload(csv_content)
                encoders.encode_base64(attachment)
                attachment.add_header(
                    'Content-Disposition',
                    f'attachment; filename="results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
                )
                msg.attach(attachment)
            
            # Send email
            server = smtplib.SMTP(smtp_config['host'], smtp_config.get('port', 587))
            server.starttls()
            server.login(smtp_config['username'], smtp_config['password'])
            server.send_message(msg)
            server.quit()
            
            return {
                "success": True,
                "recipients": recipients,
                "record_count": len(data),
                "format": "email"
            }
            
        except Exception as e:
            self.logger.error(f"Error sending email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def _create_html_report(self, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> str:
        """Create HTML report content"""
        html_template = """
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .summary { background-color: #e7f3ff; padding: 10px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h2>Batch Processing Results</h2>
            <div class="summary">
                <h3>Summary</h3>
                <p><strong>Total Records:</strong> {{ record_count }}</p>
                <p><strong>Processing Date:</strong> {{ processing_date }}</p>
                {% if metadata %}
                    {% for key, value in metadata.items() %}
                        <p><strong>{{ key }}:</strong> {{ value }}</p>
                    {% endfor %}
                {% endif %}
            </div>
            
            {% if sample_data %}
                <h3>Sample Results (First 10 records)</h3>
                <table>
                    <thead>
                        <tr>
                            {% for column in columns %}
                                <th>{{ column }}</th>
                            {% endfor %}
                        </tr>
                    </thead>
                    <tbody>
                        {% for row in sample_data %}
                            <tr>
                                {% for column in columns %}
                                    <td>{{ row.get(column, '') }}</td>
                                {% endfor %}
                            </tr>
                        {% endfor %}
                    </tbody>
                </table>
            {% endif %}
        </body>
        </html>
        """
        
        template = Template(html_template)
        columns = list(data[0].keys()) if data else []
        
        return template.render(
            record_count=len(data),
            processing_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            metadata=metadata,
            sample_data=data[:10],
            columns=columns
        )
    
    def _create_csv_attachment(self, data: List[Dict[str, Any]]) -> bytes:
        """Create CSV attachment content"""
        if not data:
            return b""
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        return output.getvalue().encode('utf-8')

class OutputFormatService:
    """Main service for managing output formats"""
    
    def __init__(self):
        self.logger = logger
    
    def create_output_handler(self, config: OutputConfig) -> OutputHandler:
        """Factory method to create appropriate output handler"""
        
        handler_mapping = {
            OutputFormat.CSV: CSVOutputHandler,
            OutputFormat.JSON: JSONOutputHandler,
            OutputFormat.EXCEL: ExcelOutputHandler,
            OutputFormat.DATABASE: DatabaseOutputHandler,
            OutputFormat.API_WEBHOOK: WebhookOutputHandler,
            OutputFormat.EMAIL_REPORT: EmailOutputHandler,
        }
        
        handler_class = handler_mapping.get(config.format)
        if not handler_class:
            raise ValueError(f"Unsupported output format: {config.format}")
        
        return handler_class(config)
    
    async def validate_output_config(self, config: OutputConfig) -> Dict[str, Any]:
        """Validate an output configuration"""
        try:
            handler = self.create_output_handler(config)
            validation_result = await handler.validate_destination()
            
            return {
                "valid": validation_result.get("valid", False),
                "format": config.format.value,
                "details": validation_result
            }
            
        except Exception as e:
            self.logger.error(f"Error validating output config: {str(e)}")
            return {"valid": False, "error": str(e)}
    
    async def write_output(self, config: OutputConfig, data: List[Dict[str, Any]], metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Write data using the specified output configuration"""
        try:
            handler = self.create_output_handler(config)
            result = await handler.write_data(data, metadata)
            
            # Send notification if configured
            if result.get("success") and config.notification:
                await self._send_notification(config.notification, result)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error writing output: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _send_notification(self, notification_config: Dict[str, Any], result: Dict[str, Any]):
        """Send notification about output completion"""
        try:
            notification_type = notification_config.get('type')
            
            if notification_type == 'webhook':
                url = notification_config.get('url')
                payload = {
                    "event": "output_completed",
                    "result": result,
                    "timestamp": datetime.now().isoformat()
                }
                requests.post(url, json=payload, timeout=30)
            
            elif notification_type == 'email':
                # Send notification email
                pass
                
        except Exception as e:
            self.logger.error(f"Error sending notification: {str(e)}")
    
    def get_supported_formats(self) -> List[str]:
        """Get list of supported output formats"""
        return [format.value for format in OutputFormat]
    
    def get_format_requirements(self, format: OutputFormat) -> Dict[str, Any]:
        """Get requirements for a specific output format"""
        
        requirements = {
            OutputFormat.CSV: {
                "required": ["destination"],
                "optional": ["delimiter", "encoding", "include_index", "column_mapping"]
            },
            OutputFormat.JSON: {
                "required": ["destination"],
                "optional": ["indent", "ensure_ascii"]
            },
            OutputFormat.EXCEL: {
                "required": ["destination"],
                "optional": ["sheet_name", "include_metadata"]
            },
            OutputFormat.DATABASE: {
                "required": ["connection_string", "table_name"],
                "optional": ["if_exists", "chunksize", "include_metadata"]
            },
            OutputFormat.API_WEBHOOK: {
                "required": ["url"],
                "optional": ["headers", "batch_size", "timeout"]
            },
            OutputFormat.EMAIL_REPORT: {
                "required": ["smtp", "recipients"],
                "optional": ["subject", "attach_csv", "template"]
            }
        }
        
        return requirements.get(format, {"required": [], "optional": []})