# IDXR Batch Processing Guide

## Overview

The IDXR Batch Processing system provides comprehensive identity resolution, data quality assessment, and data transformation capabilities through an intuitive web interface. This guide covers all processing types, data sources, output formats, and required data schemas.

## Table of Contents

1. [Processing Types](#processing-types)
2. [Data Sources](#data-sources)
3. [Output Formats](#output-formats)
4. [Data Schemas](#data-schemas)
5. [Configuration Examples](#configuration-examples)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)

---

## Processing Types

### 1. Identity Matching

**Purpose**: Match records against existing identities using multiple algorithms.

**Configuration Options**:
- `match_threshold`: Confidence threshold (0.0-1.0, default: 0.85)
- `use_ai`: Enable AI hybrid matching (default: true)
- `algorithms`: Array of algorithms to use
  - `deterministic`: Exact field matching
  - `probabilistic`: Fuzzy matching with scoring
  - `ai_hybrid`: Machine learning-based matching

**Use Cases**:
- Customer deduplication
- Identity verification
- Record linkage across systems

### 2. Data Validation

**Purpose**: Validate data quality and format compliance.

**Configuration Options**:
- `validation_level`: Validation strictness
  - `basic`: Field presence and format
  - `standard`: Enhanced validation rules
  - `comprehensive`: Full quality assessment
- `min_quality_threshold`: Minimum acceptable quality score (0-100)

**Validation Checks**:
- Email format validation
- Phone number format validation
- SSN format validation
- Date format validation
- Address completeness
- Name character validation

### 3. Data Quality Assessment

**Purpose**: Comprehensive analysis of data quality with improvement suggestions.

**Configuration Options**:
- `apply_cleaning`: Automatically clean and standardize data
- `validation_level`: Depth of quality analysis

**Quality Metrics**:
- Overall quality score (0-100)
- Field-level quality scores
- Completeness percentage
- Format consistency
- Data standardization suggestions

### 4. Deduplication

**Purpose**: Identify and remove duplicate records within a dataset.

**Configuration Options**:
- `similarity_threshold`: Minimum similarity for duplicates (0.0-1.0)
- `algorithms`: Matching algorithms to use
- `merge_strategy`: How to handle duplicates
  - `keep_first`: Keep first occurrence
  - `keep_best`: Keep highest quality record
  - `merge_fields`: Combine information

**Output**:
- Duplicate groups
- Confidence scores
- Recommended actions

### 5. Household Detection

**Purpose**: Group records by household relationships and address patterns.

**Configuration Options**:
- `address_grouping`: Group by physical address
- `name_pattern_analysis`: Analyze name relationships
- `relationship_inference`: Infer family relationships

**Detection Criteria**:
- Shared addresses
- Similar last names
- Age patterns (adults/children)
- Contact information overlap

### 6. Bulk Export

**Purpose**: Transform and export data in various formats with field mapping.

**Configuration Options**:
- `export_format`: Output format (csv, json, excel, parquet)
- `field_mappings`: Source to target field mapping
- `include_metadata`: Add processing metadata
- `anonymize_fields`: List of fields to anonymize

**Anonymization Options**:
- SSN: Show only last 4 digits
- Phone: Show only area code
- Email: Show only domain
- Address: Generic masking

---

## Data Sources

### 1. File Upload

**Supported Formats**:
- CSV (Comma-separated values)
- XLSX (Excel files)
- JSON (JavaScript Object Notation)
- Parquet (Columnar format)

**Configuration**:
```json
{
  "type": "file_upload",
  "format": "auto_detect",
  "encoding": "utf-8",
  "delimiter": "," // For CSV files
}
```

**File Requirements**:
- Maximum file size: 100MB
- UTF-8 encoding recommended
- First row should contain headers

### 2. Database Query

**Supported Databases**:
- PostgreSQL
- MySQL
- SQL Server
- Oracle
- SQLite

**Configuration**:
```json
{
  "type": "database_query",
  "database_type": "postgresql",
  "connection_string": "host=localhost port=5432 dbname=idxr user=user password=***",
  "query": "SELECT * FROM identities WHERE created_at > NOW() - INTERVAL '1 day'"
}
```

**Security Notes**:
- Use read-only database users
- Limit query execution time
- Validate SQL queries for safety

### 3. API Endpoint

**Authentication Methods**:
- None (public APIs)
- Bearer Token
- API Key
- Basic Authentication

**Configuration**:
```json
{
  "type": "api_endpoint",
  "url": "https://api.example.com/identities",
  "auth_method": "bearer",
  "auth_value": "your-token-here",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 4. Cloud Storage

**Supported Providers**:
- AWS S3
- Azure Blob Storage
- Google Cloud Storage

**Configuration**:
```json
{
  "type": "cloud_storage",
  "provider": "aws_s3",
  "bucket_name": "your-bucket",
  "file_path": "data/identities.csv",
  "credentials": {
    "access_key": "***",
    "secret_key": "***"
  }
}
```

---

## Output Formats

### 1. CSV (Comma-Separated Values)

**Features**:
- Universal compatibility
- Configurable delimiters
- Header row support

**Configuration**:
```json
{
  "format": "csv",
  "delimiter": ",",
  "include_headers": true,
  "quote_character": "\""
}
```

### 2. JSON (JavaScript Object Notation)

**Features**:
- Hierarchical data support
- Metadata inclusion
- Easy API integration

**Configuration**:
```json
{
  "format": "json",
  "pretty_print": true,
  "include_metadata": true
}
```

### 3. Excel (XLSX)

**Features**:
- Multiple worksheets
- Data formatting
- Business-friendly format

**Configuration**:
```json
{
  "format": "excel",
  "worksheet_name": "Processed_Data",
  "include_charts": false
}
```

### 4. Parquet

**Features**:
- Columnar storage
- High compression
- Big data compatible

**Configuration**:
```json
{
  "format": "parquet",
  "compression": "snappy",
  "row_group_size": 50000
}
```

---

## Data Schemas

### Required Fields

**Minimum Required**:
```json
{
  "record_id": "string (unique identifier)",
  "first_name": "string",
  "last_name": "string"
}
```

**Recommended Fields**:
```json
{
  "record_id": "string",
  "first_name": "string",
  "last_name": "string",
  "middle_name": "string (optional)",
  "dob": "string (YYYY-MM-DD format)",
  "ssn": "string (XXX-XX-XXXX format)",
  "phone": "string (any format)",
  "email": "string (valid email format)",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string (2-letter code)",
    "zip": "string"
  },
  "created_at": "string (ISO 8601 format)",
  "updated_at": "string (ISO 8601 format)"
}
```

### Field Validation Rules

**Name Fields**:
- Only alphabetic characters and spaces
- Maximum length: 50 characters
- No numbers or special characters

**Date of Birth**:
- Format: YYYY-MM-DD
- Valid date range: 1900-01-01 to current date
- Age validation (0-120 years)

**Social Security Number**:
- Format: XXX-XX-XXXX or XXXXXXXXX
- 9 digits total
- No validation of actual SSN validity

**Phone Number**:
- Supports multiple formats
- Minimum 10 digits
- International formats accepted

**Email Address**:
- RFC 5322 compliant
- Maximum length: 320 characters
- Domain validation

**Address Fields**:
- Street: Required for address-based processing
- City: Required for household detection
- State: 2-letter abbreviation preferred
- ZIP: 5 or 9 digit format

---

## Configuration Examples

### Example 1: Identity Matching with High Precision

```json
{
  "name": "High Precision Identity Matching",
  "job_type": "identity_matching",
  "config": {
    "match_threshold": 0.95,
    "use_ai": true,
    "algorithms": ["deterministic", "ai_hybrid"]
  },
  "data_source": {
    "type": "file_upload",
    "format": "csv"
  },
  "output_config": {
    "format": "json",
    "include_metadata": true,
    "anonymize_fields": ["ssn"]
  }
}
```

### Example 2: Comprehensive Data Validation

```json
{
  "name": "Comprehensive Data Validation",
  "job_type": "data_validation",
  "config": {
    "validation_level": "comprehensive",
    "min_quality_threshold": 85.0
  },
  "data_source": {
    "type": "database_query",
    "database_type": "postgresql",
    "query": "SELECT * FROM customer_data WHERE status = 'pending'"
  },
  "output_config": {
    "format": "excel",
    "include_metadata": true
  }
}
```

### Example 3: Household Detection

```json
{
  "name": "Household Analysis",
  "job_type": "household_detection",
  "config": {
    "address_grouping": true,
    "name_pattern_analysis": true,
    "relationship_inference": true
  },
  "data_source": {
    "type": "api_endpoint",
    "url": "https://api.customer-db.com/residents",
    "auth_method": "bearer",
    "auth_value": "your-api-token"
  },
  "output_config": {
    "format": "csv",
    "include_metadata": true
  }
}
```

---

## API Reference

### Create Batch Job

**Endpoint**: `POST /api/v1/batch/jobs`

**Request Body**:
```json
{
  "name": "Job Name",
  "job_type": "identity_matching|data_validation|data_quality|deduplication|household_detection|bulk_export",
  "priority": "low|normal|high",
  "created_by": "user_id",
  "input_data": [...], // For direct data submission
  "config": {...}, // Processing configuration
  "data_source": {...}, // Data source configuration
  "output_config": {...} // Output format configuration
}
```

**Response**:
```json
{
  "status": "success",
  "job_id": "BATCH_20240101_123456_abc123",
  "message": "Batch job created successfully",
  "estimated_processing_time": "5-10 minutes"
}
```

### Get Job Status

**Endpoint**: `GET /api/v1/batch/jobs/{job_id}`

**Response**:
```json
{
  "status": "success",
  "job": {
    "job_id": "BATCH_20240101_123456_abc123",
    "name": "Job Name",
    "status": "queued|processing|completed|failed",
    "progress": 75.5,
    "created_at": "2024-01-01T12:34:56Z",
    "started_at": "2024-01-01T12:35:00Z",
    "completed_at": null,
    "records_processed": 1500,
    "total_records": 2000,
    "results_file": "/api/v1/batch/jobs/BATCH_20240101_123456_abc123/results"
  }
}
```

### List Jobs

**Endpoint**: `GET /api/v1/batch/jobs`

**Query Parameters**:
- `status`: Filter by job status
- `job_type`: Filter by processing type
- `limit`: Number of jobs to return (default: 50)
- `offset`: Pagination offset

---

## Best Practices

### Data Preparation

1. **Clean Input Data**:
   - Remove empty rows and columns
   - Standardize date formats
   - Validate required fields

2. **Optimize Field Names**:
   - Use consistent naming conventions
   - Avoid special characters in headers
   - Use descriptive field names

3. **Data Size Considerations**:
   - Split large datasets (>1M records) into smaller batches
   - Use appropriate file formats for data size
   - Consider using database queries for very large datasets

### Configuration Optimization

1. **Choose Appropriate Thresholds**:
   - Start with default thresholds and adjust based on results
   - Higher thresholds = fewer false positives, more false negatives
   - Lower thresholds = more false positives, fewer false negatives

2. **Algorithm Selection**:
   - Use deterministic for exact matches
   - Use probabilistic for fuzzy matching
   - Use AI hybrid for complex pattern recognition

3. **Output Format Selection**:
   - CSV for data analysis tools
   - JSON for API integration
   - Excel for business users
   - Parquet for big data systems

### Performance Tips

1. **Batch Size Optimization**:
   - Process 10K-100K records per job for optimal performance
   - Larger batches may time out
   - Smaller batches have overhead

2. **Field Selection**:
   - Include only necessary fields for processing
   - Remove unnecessary columns to improve performance
   - Use field mappings to standardize names

3. **Monitoring and Alerting**:
   - Monitor job progress regularly
   - Set up alerts for failed jobs
   - Review processing logs for optimization opportunities

### Security Considerations

1. **Data Protection**:
   - Use anonymization for sensitive fields
   - Implement proper access controls
   - Secure data transmission (HTTPS)

2. **Authentication**:
   - Use strong API keys for data sources
   - Rotate credentials regularly
   - Limit access to sensitive data sources

3. **Compliance**:
   - Follow data retention policies
   - Implement audit logging
   - Ensure GDPR/CCPA compliance for personal data

---

## Support and Troubleshooting

### Common Issues

1. **Job Fails to Start**:
   - Check data source connectivity
   - Verify authentication credentials
   - Validate input data format

2. **Low Match Quality**:
   - Adjust threshold settings
   - Check data quality
   - Review field mappings

3. **Performance Issues**:
   - Reduce batch size
   - Optimize data source queries
   - Check system resources

### Getting Help

- **Documentation**: Review this guide and API documentation
- **Support**: Contact system administrators
- **Logs**: Check job processing logs for detailed error information

---

*Last Updated: September 2025*
*Version: 1.0*