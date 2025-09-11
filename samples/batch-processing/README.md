# IDXR Batch Processing Sample Data

This directory contains sample CSV files with 1000 users each, designed for testing different batch processing types in the IDXR system. Each file is tailored to demonstrate specific processing capabilities.

## Sample Files Overview

### 1. `identity_matching_sample.csv` (1,000 records)
**Purpose:** Test identity matching algorithms
**Content:**
- 800 unique identities
- 100 duplicate variations (name variations, typos, different data sources)
- 100 additional unique records

**Special Features:**
- Contains intentional duplicates with slight variations
- Multiple source systems represented
- Realistic Colorado demographic data

**Best for testing:**
- Deterministic matching
- Probabilistic matching
- AI/ML hybrid matching
- Fuzzy logic matching

---

### 2. `data_validation_sample.csv` (1,000 records)
**Purpose:** Test data validation and quality checking
**Content:**
- 700 high-quality records
- 300 records with various data quality issues

**Data Quality Issues Included:**
- Missing required fields (first_name, email, phone)
- Invalid email formats
- Invalid phone numbers
- Invalid ZIP codes (non-Colorado)
- Future dates in DOB field
- Missing multiple fields

**Best for testing:**
- Field validation rules
- Data completeness checks
- Format validation
- Colorado-specific validation rules

---

### 3. `household_detection_sample.csv` (899 records)
**Purpose:** Test household detection and relationship analysis
**Content:**
- 200 family groups (2-5 members each)
- 200 individual records

**Family Features:**
- Shared last names for family members
- Same addresses within families
- Appropriate age distributions (parents/children)
- Shared phone numbers (70% of families)
- Realistic family structures

**Best for testing:**
- Household grouping algorithms
- Family relationship detection
- Address-based clustering
- Age-based relationship inference

---

### 4. `data_quality_sample.csv` (1,000 records)
**Purpose:** Test data quality assessment across different quality levels
**Content:**
- 400 high-quality records (all fields populated)
- 300 medium-quality records (some optional fields missing)
- 200 low-quality records (multiple missing fields, formatting issues)
- 100 very low-quality records (severe data issues)

**Quality Issues Simulated:**
- Missing optional fields (middle_name, email, phone)
- Inconsistent formatting (UPPER/lower case names)
- Missing address components
- Graduated levels of data completeness

**Best for testing:**
- Data quality scoring algorithms
- Quality threshold enforcement
- Data completeness metrics
- Quality improvement recommendations

---

### 5. `deduplication_sample.csv` (1,000 records)
**Purpose:** Test deduplication algorithms and duplicate detection
**Content:**
- 400 unique identities
- 100 exact duplicates (same person, different source systems)
- 200 near duplicates (with variations)
- 300 additional unique records

**Duplicate Types:**
- **Exact duplicates:** Same person with different identity_id and source_system
- **Near duplicates:** Same person with variations in:
  - Name spelling (e→a substitutions)
  - Phone numbers
  - Address formatting (St→Street, Ave→Avenue)
  - Email formats

**Best for testing:**
- Duplicate detection algorithms
- Similarity scoring
- Deduplication confidence levels
- Match threshold optimization

---

### 6. `bulk_export_sample.csv` (1,000 records)
**Purpose:** Test bulk export functionality and data transformation
**Content:**
- 1,000 comprehensive identity records
- Extended fields for export testing

**Additional Fields:**
- `full_name`: Concatenated name fields
- `full_address`: Formatted complete address
- `age`: Calculated from DOB
- `phone_formatted`: Standardized phone format
- `ssn_masked`: Privacy-protected SSN (***-**-1234)
- `income_bracket`: Low/Medium/High/Very High
- `employment_status`: Employed/Unemployed/Retired/Student
- `marital_status`: Single/Married/Divorced/Widowed

**Best for testing:**
- CSV export functionality
- JSON export functionality
- Excel export functionality
- PDF report generation
- Field mapping and transformation
- Data anonymization features

---

## Colorado-Specific Features

All sample files include realistic Colorado demographic data:

### Geographic Data
- **Cities:** Denver, Colorado Springs, Aurora, Fort Collins, Boulder, etc.
- **ZIP Codes:** 80000-81999 range (Colorado-specific)
- **State:** All records use "CO"

### Phone Numbers
- **Area Codes:** 303, 720, 970 (Colorado area codes)
- **Format:** (XXX) XXX-XXXX standardized format

### Addresses
- Realistic Colorado street addresses
- Appropriate city/ZIP code combinations
- Mixed urban and suburban address patterns

---

## How to Use These Files

### 1. **Via IDXR Admin Dashboard:**
1. Navigate to Batch Processing page
2. Select "Create New Batch Job"
3. Choose appropriate processing type
4. Select "File Upload" as data source
5. Upload the corresponding sample CSV file
6. Configure output settings
7. Submit the job

### 2. **Via API:**
```bash
curl -X POST http://localhost:3000/api/v1/batch/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "job_name": "Sample Identity Matching Test",
    "data_source": {
      "type": "file",
      "path": "/path/to/samples/identity_matching_sample.csv"
    },
    "processing_type": "identity_matching",
    "algorithms": ["deterministic", "probabilistic", "ai_hybrid"],
    "output_format": "csv",
    "priority": "normal"
  }'
```

### 3. **Expected Processing Times:**
- **Identity Matching:** ~2-3 minutes (1,000 records)
- **Data Validation:** ~1-2 minutes (1,000 records)
- **Household Detection:** ~1-2 minutes (899 records)
- **Data Quality:** ~1-2 minutes (1,000 records)
- **Deduplication:** ~3-4 minutes (1,000 records with duplicates)
- **Bulk Export:** ~1-2 minutes (1,000 records)

---

## Testing Recommendations

### Progressive Testing Approach:
1. **Start Small:** Test with 100-record subsets first
2. **Single Algorithm:** Begin with deterministic matching
3. **Increase Complexity:** Add probabilistic and AI algorithms
4. **Full Dataset:** Process complete 1,000-record files
5. **Multiple Types:** Test different processing types

### Validation Steps:
1. **Monitor Progress:** Use the batch processing dashboard
2. **Check Logs:** Review processing logs for errors
3. **Validate Output:** Examine result files for accuracy
4. **Performance:** Monitor processing times and resource usage
5. **Quality Metrics:** Review confidence scores and match quality

---

## File Structure

Each CSV file contains the following standard fields:
- `identity_id`: Unique identifier (UUID)
- `first_name`: Person's first name
- `last_name`: Person's last name  
- `middle_name`: Person's middle name (optional)
- `dob`: Date of birth (YYYY-MM-DD)
- `ssn`: Social Security Number (XXX-XX-XXXX)
- `phone`: Phone number ((XXX) XXX-XXXX)
- `email`: Email address
- `street_address`: Street address
- `city`: City name (Colorado cities)
- `state`: State code (always "CO")
- `zip_code`: ZIP code (Colorado ZIP codes)
- `gender`: Gender (M/F/Other)
- `created_date`: Record creation date
- `source_system`: Source system identifier

Additional fields may be present in specific sample files as noted above.

---

## Troubleshooting

### Common Issues:
1. **File Upload Errors:** Ensure CSV files are properly formatted
2. **Processing Failures:** Check for required fields and valid data formats
3. **Memory Issues:** Consider processing smaller batches for testing
4. **Timeout Errors:** Increase timeout settings for large files

### Support:
For issues with sample data or batch processing, check:
1. IDXR system logs
2. Batch processing documentation
3. API documentation at http://localhost:3000/docs

---

*Generated by IDXR Sample Data Generator*  
*Last Updated: September 11, 2025*