# IDXR Sample Data Repository

This directory contains organized sample data files for testing various components of the IDXR Identity Cross-Resolution System.

## Directory Structure

```
samples/
├── README.md                    # This file - overview of all sample data
└── batch-processing/           # Sample data for batch processing functionality
    ├── README.md              # Detailed documentation for batch processing samples  
    ├── generate_sample_data.py # Python script to generate sample CSV files
    ├── identity_matching_sample.csv      # 1,000 records for identity matching
    ├── data_validation_sample.csv        # 1,000 records for data validation
    ├── household_detection_sample.csv    # 899 records for household detection
    ├── data_quality_sample.csv          # 1,000 records for data quality assessment
    ├── deduplication_sample.csv         # 1,000 records for deduplication testing
    └── bulk_export_sample.csv           # 1,000 records for export functionality
```

## Available Sample Categories

### 📊 Batch Processing Samples
**Location:** `samples/batch-processing/`
**Purpose:** Test batch processing functionality with file upload as data source

**Contents:**
- 6 specialized CSV files with 1,000 users each
- Python generator script for creating custom samples
- Comprehensive documentation for usage

**Processing Types Covered:**
- Identity matching algorithms (deterministic, probabilistic, AI/ML)
- Data validation and quality checking  
- Household detection and relationship analysis
- Data quality assessment and scoring
- Deduplication and duplicate detection
- Bulk export with multiple output formats

## Quick Start

### For Batch Processing Testing:
1. Navigate to `samples/batch-processing/`
2. Select appropriate CSV file for your test type
3. Upload via IDXR Admin Dashboard or API
4. Review detailed documentation in subfolder README

### Generating Custom Sample Data:
```bash
cd samples/batch-processing
python generate_sample_data.py
```

## Data Characteristics

All sample files include realistic Colorado demographic data:
- **ZIP Codes:** 80000-81999 (Colorado-specific)
- **Phone Numbers:** 303, 720, 970 area codes
- **Cities:** Denver, Aurora, Boulder, Fort Collins, etc.
- **Realistic Demographics:** Appropriate age distributions and family structures

## Future Sample Categories

This structure allows for easy addition of new sample categories:
- `samples/api-testing/` - Sample data for API endpoint testing
- `samples/performance/` - Large datasets for performance testing  
- `samples/security/` - Sample data for security and validation testing
- `samples/integration/` - Cross-system integration test data

## Contributing Sample Data

When adding new sample categories:
1. Create appropriately named subdirectory
2. Include detailed README.md in subdirectory
3. Follow Colorado demographic patterns for consistency
4. Update this main README with new category information

---

**Last Updated:** September 11, 2025  
**System:** IDXR Identity Cross-Resolution System  
**Contact:** Review subfolder documentation for specific usage instructions