#!/usr/bin/env python3
"""
Test frontend-backend integration for IDXR batch processing
Tests the complete integration of frontend form data with backend processing
"""

import requests
import json
import time

def test_frontend_backend_integration():
    """Test frontend form data integration with backend API"""
    base_url = "http://localhost:3000"
    
    print("Testing Frontend-Backend Integration...")
    print("=" * 50)
    
    # Test case 1: Identity Matching with detailed configuration
    print("\n1. Testing Identity Matching Job with Frontend Configuration...")
    identity_job = {
        "name": "Frontend Identity Matching Test",
        "job_type": "identity_matching",
        "priority": "normal",
        "created_by": "web_user",
        "input_data": [
            {
                "record_id": "FE_001",
                "first_name": "John",
                "last_name": "Doe",
                "dob": "1985-03-15",
                "ssn": "1234",
                "phone": "(303) 555-0123",
                "email": "john.doe@test.com",
                "address": {
                    "street": "123 Main St",
                    "city": "Denver",
                    "state": "CO", 
                    "zip": "80202"
                }
            }
        ],
        "config": {
            "match_threshold": 0.85,
            "use_ai": True,
            "algorithms": ["deterministic", "probabilistic", "ai_hybrid"]
        },
        "data_source": {
            "type": "file_upload",
            "format": "auto_detect"
        },
        "output_config": {
            "format": "csv",
            "include_metadata": True,
            "anonymize_fields": ["ssn"]
        }
    }
    
    response = requests.post(f"{base_url}/api/v1/batch/jobs", json=identity_job)
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Job ID: {data.get('job_id', 'N/A')}")
        print("  ✓ Identity matching job created successfully")
    else:
        print(f"  ✗ Failed: {response.text}")
    
    # Test case 2: Data Validation with comprehensive configuration
    print("\n2. Testing Data Validation Job with Frontend Configuration...")
    validation_job = {
        "name": "Frontend Data Validation Test",
        "job_type": "data_validation",
        "priority": "high",
        "created_by": "web_user",
        "input_data": [
            {
                "record_id": "FE_002",
                "first_name": "Jane123",  # Invalid name
                "last_name": "Smith",
                "email": "invalid-email",  # Invalid email
                "phone": "not-a-phone"     # Invalid phone
            }
        ],
        "config": {
            "validation_level": "comprehensive",
            "min_quality_threshold": 70.0
        },
        "data_source": {
            "type": "database_query",
            "database_type": "postgresql",
            "connection_string": "host=localhost port=5432 dbname=test",
            "query": "SELECT * FROM test_data"
        },
        "output_config": {
            "format": "json",
            "include_metadata": True,
            "anonymize_fields": []
        }
    }
    
    response = requests.post(f"{base_url}/api/v1/batch/jobs", json=validation_job)
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Job ID: {data.get('job_id', 'N/A')}")
        print("  ✓ Data validation job created successfully")
    else:
        print(f"  ✗ Failed: {response.text}")
    
    # Test case 3: Bulk Export with field mapping
    print("\n3. Testing Bulk Export Job with Frontend Configuration...")
    export_job = {
        "name": "Frontend Bulk Export Test",
        "job_type": "bulk_export",
        "priority": "normal",
        "created_by": "web_user",
        "input_data": [
            {
                "record_id": "FE_003",
                "first_name": "Alice",
                "last_name": "Johnson",
                "dob": "1990-05-20",
                "ssn": "123-45-6789",
                "phone": "(303) 555-0789",
                "email": "alice.johnson@test.com"
            }
        ],
        "config": {
            "export_format": "excel",
            "field_mappings": {
                "first_name": "FirstName",
                "last_name": "LastName",
                "dob": "DateOfBirth",
                "phone": "PhoneNumber"
            },
            "include_metadata": True,
            "anonymize_fields": ["ssn"]
        },
        "data_source": {
            "type": "cloud_storage",
            "provider": "aws_s3",
            "bucket_name": "test-bucket",
            "file_path": "data/export_test.csv"
        },
        "output_config": {
            "format": "excel",
            "include_metadata": True,
            "anonymize_fields": ["ssn"]
        }
    }
    
    response = requests.post(f"{base_url}/api/v1/batch/jobs", json=export_job)
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Job ID: {data.get('job_id', 'N/A')}")
        print("  ✓ Bulk export job created successfully")
    else:
        print(f"  ✗ Failed: {response.text}")
    
    # Test case 4: Household Detection with address grouping
    print("\n4. Testing Household Detection Job with Frontend Configuration...")
    household_job = {
        "name": "Frontend Household Detection Test", 
        "job_type": "household_detection",
        "priority": "normal",
        "created_by": "web_user",
        "input_data": [
            {
                "record_id": "FE_004",
                "first_name": "Bob",
                "last_name": "Wilson",
                "dob": "1975-12-10",
                "address": {
                    "street": "456 Oak Ave",
                    "city": "Boulder",
                    "state": "CO",
                    "zip": "80301"
                }
            }
        ],
        "config": {
            "address_grouping": True,
            "name_pattern_analysis": True
        },
        "data_source": {
            "type": "api_endpoint",
            "url": "https://api.example.com/households",
            "auth_method": "bearer",
            "auth_value": "test-token-123"
        },
        "output_config": {
            "format": "json",
            "include_metadata": True,
            "anonymize_fields": []
        }
    }
    
    response = requests.post(f"{base_url}/api/v1/batch/jobs", json=household_job)
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Job ID: {data.get('job_id', 'N/A')}")
        print("  ✓ Household detection job created successfully")
    else:
        print(f"  ✗ Failed: {response.text}")
    
    # Test case 5: Deduplication with similarity threshold
    print("\n5. Testing Deduplication Job with Frontend Configuration...")
    dedup_job = {
        "name": "Frontend Deduplication Test",
        "job_type": "deduplication", 
        "priority": "normal",
        "created_by": "web_user",
        "input_data": [
            {
                "record_id": "FE_005A",
                "first_name": "Charlie",
                "last_name": "Brown",
                "dob": "1980-08-15",
                "ssn": "9876"
            },
            {
                "record_id": "FE_005B", 
                "first_name": "Charlie",
                "last_name": "Brown",
                "dob": "1980-08-15",
                "ssn": "9876"
            }
        ],
        "config": {
            "similarity_threshold": 0.90,
            "algorithms": ["deterministic", "probabilistic"]
        },
        "data_source": {
            "type": "file_upload",
            "format": "auto_detect"
        },
        "output_config": {
            "format": "csv",
            "include_metadata": False,
            "anonymize_fields": ["ssn"]
        }
    }
    
    response = requests.post(f"{base_url}/api/v1/batch/jobs", json=dedup_job)
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Job ID: {data.get('job_id', 'N/A')}")
        print("  ✓ Deduplication job created successfully")
    else:
        print(f"  ✗ Failed: {response.text}")
    
    # Test case 6: Data Quality with cleaning options
    print("\n6. Testing Data Quality Job with Frontend Configuration...")
    quality_job = {
        "name": "Frontend Data Quality Test",
        "job_type": "data_quality",
        "priority": "normal", 
        "created_by": "web_user",
        "input_data": [
            {
                "record_id": "FE_006",
                "first_name": "diana",           # Poor capitalization
                "last_name": "MARTINEZ",         # Poor capitalization
                "dob": "03/25/1988",            # Non-standard format
                "phone": "3035551234",          # Unformatted
                "email": "DIANA@EXAMPLE.COM"    # Mixed case
            }
        ],
        "config": {
            "apply_cleaning": True,
            "validation_level": "enhanced"
        },
        "data_source": {
            "type": "existing_dataset"
        },
        "output_config": {
            "format": "json",
            "include_metadata": True,
            "anonymize_fields": []
        }
    }
    
    response = requests.post(f"{base_url}/api/v1/batch/jobs", json=quality_job)
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Job ID: {data.get('job_id', 'N/A')}")
        print("  ✓ Data quality job created successfully")
    else:
        print(f"  ✗ Failed: {response.text}")
    
    # Wait a moment and check job status
    print("\n7. Checking Job Status...")
    time.sleep(2)
    
    try:
        response = requests.get(f"{base_url}/api/v1/batch/jobs")
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success' and data.get('jobs'):
                print(f"  ✓ Found {len(data['jobs'])} jobs in system")
                for job in data['jobs'][:3]:  # Show first 3 jobs
                    print(f"    - {job['name']}: {job['status']} ({job['job_type']})")
            else:
                print("  ✓ Jobs endpoint working but no jobs found")
        else:
            print(f"  ✗ Failed to get jobs: {response.status_code}")
    except Exception as e:
        print(f"  ✗ Error checking jobs: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Frontend-Backend Integration Test Complete!")
    print("✓ All processing types tested with frontend-style configuration")
    print("✓ Data source configurations tested") 
    print("✓ Output format configurations tested")
    print("✓ Processing-specific configurations tested")

if __name__ == "__main__":
    test_frontend_backend_integration()