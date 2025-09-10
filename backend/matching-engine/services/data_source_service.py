"""
Comprehensive Data Source Service for IDXR
Supports multiple data sources: files, databases, APIs, existing datasets
"""

import asyncio
import json
import pandas as pd
import sqlite3
import psycopg2
import pymongo
import requests
import csv
import io
import openpyxl
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, AsyncGenerator
from enum import Enum
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
import logging
from pathlib import Path
import yaml
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
import boto3
import pyodbc
import mysql.connector
from sqlalchemy import create_engine, text
import ftplib
import paramiko
import zipfile
import gzip

from utils.logger import setup_logger

logger = setup_logger("data_source_service")

class DataSourceType(Enum):
    FILE_UPLOAD = "file_upload"
    LOCAL_FILE = "local_file"
    FTP_FILE = "ftp_file"
    SFTP_FILE = "sftp_file"
    HTTP_URL = "http_url"
    DATABASE_QUERY = "database_query"
    API_ENDPOINT = "api_endpoint"
    EXISTING_DATASET = "existing_dataset"
    S3_BUCKET = "s3_bucket"
    AZURE_BLOB = "azure_blob"
    GOOGLE_CLOUD = "google_cloud"
    KAFKA_STREAM = "kafka_stream"
    RABBITMQ_QUEUE = "rabbitmq_queue"

class FileFormat(Enum):
    CSV = "csv"
    JSON = "json"
    JSONL = "jsonl"
    EXCEL = "excel"
    XML = "xml"
    YAML = "yaml"
    PARQUET = "parquet"
    AVRO = "avro"
    TSV = "tsv"
    FIXED_WIDTH = "fixed_width"

class DatabaseType(Enum):
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    SQLITE = "sqlite"
    MSSQL = "mssql"
    ORACLE = "oracle"
    MONGODB = "mongodb"
    REDIS = "redis"
    CASSANDRA = "cassandra"
    ELASTICSEARCH = "elasticsearch"

class OutputFormat(Enum):
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    PARQUET = "parquet"
    JSONL = "jsonl"
    XML = "xml"
    DATABASE = "database"
    API_WEBHOOK = "api_webhook"
    EMAIL_REPORT = "email_report"
    S3_EXPORT = "s3_export"
    DASHBOARD = "dashboard"

@dataclass
class DataSourceConfig:
    source_type: DataSourceType
    config: Dict[str, Any]
    format: Optional[FileFormat] = None
    connection_string: Optional[str] = None
    credentials: Optional[Dict[str, str]] = None
    validation_rules: Optional[Dict[str, Any]] = None
    transformation_rules: Optional[List[Dict[str, Any]]] = None

@dataclass
class OutputConfig:
    format: OutputFormat
    destination: str
    config: Dict[str, Any]
    filename_template: Optional[str] = None
    compression: Optional[str] = None
    encryption: Optional[Dict[str, str]] = None

class DataSource(ABC):
    """Abstract base class for all data sources"""
    
    def __init__(self, config: DataSourceConfig):
        self.config = config
        self.logger = logger
    
    @abstractmethod
    async def validate_connection(self) -> Dict[str, Any]:
        """Validate the data source connection"""
        pass
    
    @abstractmethod
    async def get_schema(self) -> Dict[str, Any]:
        """Get the schema/structure of the data source"""
        pass
    
    @abstractmethod
    async def preview_data(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Preview sample data from the source"""
        pass
    
    @abstractmethod
    async def get_record_count(self) -> int:
        """Get the total number of records"""
        pass
    
    @abstractmethod
    async def read_data(self, batch_size: int = 1000) -> AsyncGenerator[List[Dict[str, Any]], None]:
        """Read data in batches"""
        pass

class FileDataSource(DataSource):
    """Handler for file-based data sources"""
    
    async def validate_connection(self) -> Dict[str, Any]:
        try:
            file_path = self.config.config.get('file_path')
            if not file_path or not Path(file_path).exists():
                return {"valid": False, "error": "File not found"}
            
            file_size = Path(file_path).stat().st_size
            return {
                "valid": True,
                "file_size": file_size,
                "format": self.config.format.value if self.config.format else "auto-detect"
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def get_schema(self) -> Dict[str, Any]:
        file_path = self.config.config.get('file_path')
        format_type = self.config.format
        
        try:
            if format_type == FileFormat.CSV:
                df = pd.read_csv(file_path, nrows=100)
                return {
                    "columns": list(df.columns),
                    "types": df.dtypes.to_dict(),
                    "sample_values": df.head(3).to_dict('records')
                }
            elif format_type == FileFormat.JSON:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list) and data:
                        sample = data[0]
                        return {
                            "columns": list(sample.keys()) if isinstance(sample, dict) else [],
                            "sample_values": data[:3]
                        }
            elif format_type == FileFormat.EXCEL:
                df = pd.read_excel(file_path, nrows=100)
                return {
                    "columns": list(df.columns),
                    "types": df.dtypes.to_dict(),
                    "sheets": pd.ExcelFile(file_path).sheet_names,
                    "sample_values": df.head(3).to_dict('records')
                }
            # Add more format handlers...
            
        except Exception as e:
            return {"error": str(e)}
    
    async def preview_data(self, limit: int = 10) -> List[Dict[str, Any]]:
        file_path = self.config.config.get('file_path')
        format_type = self.config.format
        
        try:
            if format_type == FileFormat.CSV:
                df = pd.read_csv(file_path, nrows=limit)
                return df.to_dict('records')
            elif format_type == FileFormat.JSON:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    return data[:limit] if isinstance(data, list) else [data]
            elif format_type == FileFormat.EXCEL:
                sheet_name = self.config.config.get('sheet_name', 0)
                df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=limit)
                return df.to_dict('records')
            # Add more format handlers...
            
        except Exception as e:
            self.logger.error(f"Error previewing data: {str(e)}")
            return []
    
    async def get_record_count(self) -> int:
        file_path = self.config.config.get('file_path')
        format_type = self.config.format
        
        try:
            if format_type == FileFormat.CSV:
                with open(file_path, 'r') as f:
                    return sum(1 for line in f) - 1  # Subtract header
            elif format_type == FileFormat.JSON:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    return len(data) if isinstance(data, list) else 1
            elif format_type == FileFormat.EXCEL:
                sheet_name = self.config.config.get('sheet_name', 0)
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                return len(df)
            
        except Exception as e:
            self.logger.error(f"Error counting records: {str(e)}")
            return 0
    
    async def read_data(self, batch_size: int = 1000) -> AsyncGenerator[List[Dict[str, Any]], None]:
        file_path = self.config.config.get('file_path')
        format_type = self.config.format
        
        try:
            if format_type == FileFormat.CSV:
                chunk_reader = pd.read_csv(file_path, chunksize=batch_size)
                for chunk in chunk_reader:
                    yield chunk.to_dict('records')
            
            elif format_type == FileFormat.JSON:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for i in range(0, len(data), batch_size):
                            yield data[i:i + batch_size]
                    else:
                        yield [data]
            
            elif format_type == FileFormat.EXCEL:
                sheet_name = self.config.config.get('sheet_name', 0)
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                for i in range(0, len(df), batch_size):
                    chunk = df.iloc[i:i + batch_size]
                    yield chunk.to_dict('records')
                    
        except Exception as e:
            self.logger.error(f"Error reading data: {str(e)}")
            yield []

class DatabaseDataSource(DataSource):
    """Handler for database-based data sources"""
    
    async def validate_connection(self) -> Dict[str, Any]:
        try:
            db_type = DatabaseType(self.config.config.get('database_type'))
            connection_string = self.config.connection_string
            
            if db_type == DatabaseType.POSTGRESQL:
                conn = psycopg2.connect(connection_string)
                conn.close()
            elif db_type == DatabaseType.MYSQL:
                conn = mysql.connector.connect(
                    host=self.config.config.get('host'),
                    user=self.config.config.get('username'),
                    password=self.config.config.get('password'),
                    database=self.config.config.get('database')
                )
                conn.close()
            elif db_type == DatabaseType.SQLITE:
                conn = sqlite3.connect(self.config.config.get('database_path'))
                conn.close()
            elif db_type == DatabaseType.MONGODB:
                client = pymongo.MongoClient(connection_string)
                client.admin.command('ping')
                client.close()
            
            return {"valid": True, "database_type": db_type.value}
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def get_schema(self) -> Dict[str, Any]:
        try:
            db_type = DatabaseType(self.config.config.get('database_type'))
            query = self.config.config.get('query')
            
            if db_type in [DatabaseType.POSTGRESQL, DatabaseType.MYSQL, DatabaseType.SQLITE]:
                engine = create_engine(self.config.connection_string)
                # Get schema by running a LIMIT query
                df = pd.read_sql(f"{query} LIMIT 10", engine)
                return {
                    "columns": list(df.columns),
                    "types": df.dtypes.to_dict(),
                    "sample_values": df.head(3).to_dict('records')
                }
            elif db_type == DatabaseType.MONGODB:
                client = pymongo.MongoClient(self.config.connection_string)
                db = client[self.config.config.get('database')]
                collection = db[self.config.config.get('collection')]
                sample_docs = list(collection.find().limit(3))
                
                if sample_docs:
                    columns = set()
                    for doc in sample_docs:
                        columns.update(doc.keys())
                    
                    return {
                        "columns": list(columns),
                        "sample_values": sample_docs
                    }
                
        except Exception as e:
            return {"error": str(e)}
    
    async def preview_data(self, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            db_type = DatabaseType(self.config.config.get('database_type'))
            
            if db_type in [DatabaseType.POSTGRESQL, DatabaseType.MYSQL, DatabaseType.SQLITE]:
                engine = create_engine(self.config.connection_string)
                query = self.config.config.get('query')
                df = pd.read_sql(f"{query} LIMIT {limit}", engine)
                return df.to_dict('records')
            elif db_type == DatabaseType.MONGODB:
                client = pymongo.MongoClient(self.config.connection_string)
                db = client[self.config.config.get('database')]
                collection = db[self.config.config.get('collection')]
                
                filter_query = self.config.config.get('filter', {})
                docs = list(collection.find(filter_query).limit(limit))
                return docs
                
        except Exception as e:
            self.logger.error(f"Error previewing database data: {str(e)}")
            return []
    
    async def get_record_count(self) -> int:
        try:
            db_type = DatabaseType(self.config.config.get('database_type'))
            
            if db_type in [DatabaseType.POSTGRESQL, DatabaseType.MYSQL, DatabaseType.SQLITE]:
                engine = create_engine(self.config.connection_string)
                query = self.config.config.get('query')
                # Wrap query in COUNT
                count_query = f"SELECT COUNT(*) as count FROM ({query}) as subquery"
                result = pd.read_sql(count_query, engine)
                return result['count'].iloc[0]
            elif db_type == DatabaseType.MONGODB:
                client = pymongo.MongoClient(self.config.connection_string)
                db = client[self.config.config.get('database')]
                collection = db[self.config.config.get('collection')]
                filter_query = self.config.config.get('filter', {})
                return collection.count_documents(filter_query)
                
        except Exception as e:
            self.logger.error(f"Error counting database records: {str(e)}")
            return 0
    
    async def read_data(self, batch_size: int = 1000) -> AsyncGenerator[List[Dict[str, Any]], None]:
        try:
            db_type = DatabaseType(self.config.config.get('database_type'))
            
            if db_type in [DatabaseType.POSTGRESQL, DatabaseType.MYSQL, DatabaseType.SQLITE]:
                engine = create_engine(self.config.connection_string)
                query = self.config.config.get('query')
                
                # Use pandas chunking for SQL databases
                chunk_reader = pd.read_sql(query, engine, chunksize=batch_size)
                for chunk in chunk_reader:
                    yield chunk.to_dict('records')
                    
            elif db_type == DatabaseType.MONGODB:
                client = pymongo.MongoClient(self.config.connection_string)
                db = client[self.config.config.get('database')]
                collection = db[self.config.config.get('collection')]
                filter_query = self.config.config.get('filter', {})
                
                # Use cursor for MongoDB
                cursor = collection.find(filter_query).batch_size(batch_size)
                batch = []
                for doc in cursor:
                    batch.append(doc)
                    if len(batch) >= batch_size:
                        yield batch
                        batch = []
                
                if batch:  # Yield remaining documents
                    yield batch
                    
        except Exception as e:
            self.logger.error(f"Error reading database data: {str(e)}")
            yield []

class APIDataSource(DataSource):
    """Handler for API-based data sources"""
    
    async def validate_connection(self) -> Dict[str, Any]:
        try:
            url = self.config.config.get('url')
            headers = self.config.config.get('headers', {})
            auth = self.config.config.get('auth')
            
            # Add authentication if provided
            auth_obj = None
            if auth:
                if auth.get('type') == 'basic':
                    auth_obj = (auth.get('username'), auth.get('password'))
                elif auth.get('type') == 'bearer':
                    headers['Authorization'] = f"Bearer {auth.get('token')}"
            
            response = requests.get(url, headers=headers, auth=auth_obj, timeout=30)
            response.raise_for_status()
            
            return {
                "valid": True,
                "status_code": response.status_code,
                "content_type": response.headers.get('content-type', ''),
                "response_size": len(response.content)
            }
            
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    async def get_schema(self) -> Dict[str, Any]:
        try:
            url = self.config.config.get('url')
            headers = self.config.config.get('headers', {})
            auth = self.config.config.get('auth')
            
            auth_obj = None
            if auth and auth.get('type') == 'basic':
                auth_obj = (auth.get('username'), auth.get('password'))
            elif auth and auth.get('type') == 'bearer':
                headers['Authorization'] = f"Bearer {auth.get('token')}"
            
            response = requests.get(url, headers=headers, auth=auth_obj, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Handle different API response structures
            if isinstance(data, list) and data:
                sample = data[0]
                return {
                    "columns": list(sample.keys()) if isinstance(sample, dict) else [],
                    "sample_values": data[:3],
                    "is_array": True
                }
            elif isinstance(data, dict):
                # Check if it's a paginated response
                data_key = self.config.config.get('data_key', 'data')
                if data_key in data and isinstance(data[data_key], list):
                    items = data[data_key]
                    if items:
                        return {
                            "columns": list(items[0].keys()) if isinstance(items[0], dict) else [],
                            "sample_values": items[:3],
                            "is_paginated": True,
                            "pagination_info": {k: v for k, v in data.items() if k != data_key}
                        }
                else:
                    return {
                        "columns": list(data.keys()),
                        "sample_values": [data],
                        "is_single_object": True
                    }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def preview_data(self, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            url = self.config.config.get('url')
            headers = self.config.config.get('headers', {})
            auth = self.config.config.get('auth')
            
            auth_obj = None
            if auth and auth.get('type') == 'basic':
                auth_obj = (auth.get('username'), auth.get('password'))
            elif auth and auth.get('type') == 'bearer':
                headers['Authorization'] = f"Bearer {auth.get('token')}"
            
            # Add limit parameter if supported
            params = self.config.config.get('params', {})
            if self.config.config.get('supports_limit'):
                params['limit'] = limit
            
            response = requests.get(url, headers=headers, auth=auth_obj, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract data based on API structure
            if isinstance(data, list):
                return data[:limit]
            elif isinstance(data, dict):
                data_key = self.config.config.get('data_key', 'data')
                if data_key in data and isinstance(data[data_key], list):
                    return data[data_key][:limit]
                else:
                    return [data]
            
        except Exception as e:
            self.logger.error(f"Error previewing API data: {str(e)}")
            return []
    
    async def get_record_count(self) -> int:
        try:
            # For APIs, we might need to make a separate count request
            count_url = self.config.config.get('count_url')
            if count_url:
                headers = self.config.config.get('headers', {})
                auth = self.config.config.get('auth')
                
                auth_obj = None
                if auth and auth.get('type') == 'basic':
                    auth_obj = (auth.get('username'), auth.get('password'))
                elif auth and auth.get('type') == 'bearer':
                    headers['Authorization'] = f"Bearer {auth.get('token')}"
                
                response = requests.get(count_url, headers=headers, auth=auth_obj, timeout=30)
                response.raise_for_status()
                
                count_data = response.json()
                count_key = self.config.config.get('count_key', 'count')
                return count_data.get(count_key, 0)
            else:
                # Fallback: get all data and count (not efficient for large datasets)
                preview = await self.preview_data(limit=999999)
                return len(preview)
                
        except Exception as e:
            self.logger.error(f"Error counting API records: {str(e)}")
            return 0
    
    async def read_data(self, batch_size: int = 1000) -> AsyncGenerator[List[Dict[str, Any]], None]:
        try:
            url = self.config.config.get('url')
            headers = self.config.config.get('headers', {})
            auth = self.config.config.get('auth')
            
            auth_obj = None
            if auth and auth.get('type') == 'basic':
                auth_obj = (auth.get('username'), auth.get('password'))
            elif auth and auth.get('type') == 'bearer':
                headers['Authorization'] = f"Bearer {auth.get('token')}"
            
            # Handle pagination
            supports_pagination = self.config.config.get('supports_pagination', False)
            if supports_pagination:
                page = 1
                while True:
                    params = self.config.config.get('params', {}).copy()
                    
                    # Add pagination parameters
                    pagination_type = self.config.config.get('pagination_type', 'page')
                    if pagination_type == 'page':
                        params['page'] = page
                        params['per_page'] = batch_size
                    elif pagination_type == 'offset':
                        params['offset'] = (page - 1) * batch_size
                        params['limit'] = batch_size
                    
                    response = requests.get(url, headers=headers, auth=auth_obj, params=params, timeout=30)
                    response.raise_for_status()
                    
                    data = response.json()
                    
                    # Extract items from response
                    data_key = self.config.config.get('data_key', 'data')
                    if isinstance(data, list):
                        items = data
                    elif data_key in data:
                        items = data[data_key]
                    else:
                        items = [data]
                    
                    if not items:
                        break
                    
                    yield items
                    page += 1
                    
                    # Check if we've reached the end
                    if len(items) < batch_size:
                        break
            else:
                # Single request for all data
                response = requests.get(url, headers=headers, auth=auth_obj, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                
                if isinstance(data, list):
                    # Yield in batches
                    for i in range(0, len(data), batch_size):
                        yield data[i:i + batch_size]
                else:
                    yield [data]
                    
        except Exception as e:
            self.logger.error(f"Error reading API data: {str(e)}")
            yield []

class DataSourceService:
    """Main service for managing data sources"""
    
    def __init__(self):
        self.logger = logger
        self.data_sources = {}
    
    def create_data_source(self, config: DataSourceConfig) -> DataSource:
        """Factory method to create appropriate data source"""
        
        if config.source_type in [DataSourceType.FILE_UPLOAD, DataSourceType.LOCAL_FILE, DataSourceType.FTP_FILE, DataSourceType.SFTP_FILE]:
            return FileDataSource(config)
        elif config.source_type == DataSourceType.DATABASE_QUERY:
            return DatabaseDataSource(config)
        elif config.source_type == DataSourceType.API_ENDPOINT:
            return APIDataSource(config)
        else:
            raise ValueError(f"Unsupported data source type: {config.source_type}")
    
    async def validate_data_source(self, config: DataSourceConfig) -> Dict[str, Any]:
        """Validate a data source configuration"""
        try:
            data_source = self.create_data_source(config)
            validation_result = await data_source.validate_connection()
            
            if validation_result.get('valid'):
                # Also get schema and preview
                schema = await data_source.get_schema()
                preview = await data_source.preview_data(5)
                record_count = await data_source.get_record_count()
                
                validation_result.update({
                    'schema': schema,
                    'preview': preview,
                    'record_count': record_count
                })
            
            return validation_result
            
        except Exception as e:
            self.logger.error(f"Error validating data source: {str(e)}")
            return {"valid": False, "error": str(e)}
    
    async def get_data_source_info(self, config: DataSourceConfig) -> Dict[str, Any]:
        """Get comprehensive information about a data source"""
        try:
            data_source = self.create_data_source(config)
            
            # Run all info gathering operations
            validation = await data_source.validate_connection()
            schema = await data_source.get_schema()
            preview = await data_source.preview_data(10)
            record_count = await data_source.get_record_count()
            
            return {
                "validation": validation,
                "schema": schema,
                "preview": preview,
                "record_count": record_count,
                "source_type": config.source_type.value,
                "format": config.format.value if config.format else None
            }
            
        except Exception as e:
            self.logger.error(f"Error getting data source info: {str(e)}")
            return {"error": str(e)}
    
    def get_supported_formats(self, source_type: DataSourceType) -> List[str]:
        """Get supported formats for a data source type"""
        
        format_mappings = {
            DataSourceType.FILE_UPLOAD: [f.value for f in FileFormat],
            DataSourceType.LOCAL_FILE: [f.value for f in FileFormat],
            DataSourceType.DATABASE_QUERY: ["sql", "nosql"],
            DataSourceType.API_ENDPOINT: ["json", "xml", "csv"],
            DataSourceType.EXISTING_DATASET: [f.value for f in FileFormat]
        }
        
        return format_mappings.get(source_type, [])
    
    def get_required_fields(self, source_type: DataSourceType) -> Dict[str, Any]:
        """Get required configuration fields for a data source type"""
        
        field_mappings = {
            DataSourceType.FILE_UPLOAD: {
                "required": ["file"],
                "optional": ["format", "encoding", "delimiter", "sheet_name"]
            },
            DataSourceType.LOCAL_FILE: {
                "required": ["file_path"],
                "optional": ["format", "encoding", "delimiter", "sheet_name"]
            },
            DataSourceType.FTP_FILE: {
                "required": ["host", "username", "password", "file_path"],
                "optional": ["port", "passive_mode", "format"]
            },
            DataSourceType.DATABASE_QUERY: {
                "required": ["database_type", "connection_string", "query"],
                "optional": ["host", "port", "username", "password", "database"]
            },
            DataSourceType.API_ENDPOINT: {
                "required": ["url"],
                "optional": ["headers", "auth", "params", "data_key", "pagination"]
            },
            DataSourceType.EXISTING_DATASET: {
                "required": ["dataset_id"],
                "optional": ["version", "format"]
            }
        }
        
        return field_mappings.get(source_type, {"required": [], "optional": []})