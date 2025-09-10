"""
Test script for data transformation endpoints in IDXR system
"""

import requests
import json
from typing import Dict, List, Any

BASE_URL = "http://localhost:3002/api/v1"

def test_field_types_endpoint():
    """Test getting available field types"""
    print("Testing /transformations/field-types endpoint...")
    
    response = requests.get(f"{BASE_URL}/transformations/field-types")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Available field types: {len(data['field_types'])}")
        for field_type in data['field_types'][:3]:  # Show first 3
            print(f"  - {field_type['name']}: {field_type['value']}")
        return True
    else:
        print(f"Error: {response.text}")
        return False

def test_transformation_types_endpoint():
    """Test getting available transformation types"""
    print("\nTesting /transformations/transformation-types endpoint...")
    
    response = requests.get(f"{BASE_URL}/transformations/transformation-types")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Available transformation types: {len(data['transformation_types'])}")
        for trans_type in data['transformation_types'][:3]:  # Show first 3
            print(f"  - {trans_type['name']}: {trans_type['value']}")
        return True
    else:
        print(f"Error: {response.text}")
        return False

def test_field_suggestions_endpoint():
    """Test field mapping suggestions"""
    print("\nTesting /transformations/suggest-fields endpoint...")
    
    # Sample data for suggestions
    sample_data = [
        {
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1980-01-15",
            "ssn": "123456789",
            "phone": "555-0123",
            "email": "john.doe@email.com",
            "address_street": "123 Main St",
            "address_city": "Denver",
            "address_state": "CO",
            "address_zip": "80202"
        },
        {
            "first_name": "Jane",
            "last_name": "Smith", 
            "dob": "1985-03-22",
            "ssn": "987654321",
            "phone": "555-0456",
            "email": "jane.smith@email.com",
            "address_street": "456 Oak Ave",
            "address_city": "Boulder",
            "address_state": "CO",
            "address_zip": "80301"
        }
    ]
    
    response = requests.post(f"{BASE_URL}/transformations/suggest-fields", 
                           json={"sample_data": sample_data})
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        suggestions = data['suggestions']
        print(f"Generated {len(suggestions['suggestions'])} field suggestions:")
        for suggestion in suggestions['suggestions']:
            print(f"  - {suggestion['source_field']} -> {suggestion['suggested_target']} (confidence: {suggestion['confidence']})")
        return True
    else:
        print(f"Error: {response.text}")
        return False

def test_create_mapping_endpoint():
    """Test creating a data mapping configuration"""
    print("\nTesting /transformations/create-mapping endpoint...")
    
    mapping_data = {
        "mapping_name": "Test Identity Mapping",
        "description": "Test mapping configuration for identity data",
        "field_mappings": [
            {
                "source_field": "first_name",
                "target_field": "first_name",
                "transformation_rules": [
                    {
                        "parameters": {
                            "title_case": True,
                            "normalize_spaces": True
                        }
                    }
                ],
                "validation_rules": [
                    {
                        "parameters": {
                            "min_length": 1,
                            "max_length": 50,
                            "alphabetic_only": True
                        }
                    }
                ],
                "is_required": True
            },
            {
                "source_field": "last_name",
                "target_field": "last_name",
                "transformation_rules": [
                    {
                        "parameters": {
                            "title_case": True,
                            "normalize_spaces": True
                        }
                    }
                ],
                "validation_rules": [
                    {
                        "parameters": {
                            "min_length": 1,
                            "max_length": 50,
                            "alphabetic_only": True
                        }
                    }
                ],
                "is_required": True
            },
            {
                "source_field": "email",
                "target_field": "email",
                "transformation_rules": [
                    {
                        "parameters": {
                            "normalize_domain": True
                        }
                    }
                ],
                "validation_rules": [
                    {
                        "parameters": {
                            "allow_empty": False
                        }
                    }
                ],
                "is_required": True
            }
        ],
        "global_transformations": [],
        "validation_rules": []
    }
    
    response = requests.post(f"{BASE_URL}/transformations/create-mapping",
                           json={"mapping_data": mapping_data})
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        config = data['mapping_config']
        print(f"Created mapping: {config['mapping_name']}")
        print(f"Field mappings: {config['field_count']}")
        print(f"Transformations: {config['transformation_count']}")
        return mapping_data
    else:
        print(f"Error: {response.text}")
        return None

def test_apply_transformations_endpoint(mapping_config):
    """Test applying transformations to data"""
    print("\nTesting /transformations/apply endpoint...")
    
    test_data = [
        {
            "first_name": "john",
            "last_name": "DOE",
            "email": "john.doe@gmail.co"
        },
        {
            "first_name": "jane  marie",
            "last_name": "SMITH-JONES",
            "email": "JANE@HOTMAIL.CO"
        }
    ]
    
    response = requests.post(f"{BASE_URL}/transformations/apply",
                           json={
                               "data": test_data,
                               "mapping_config": mapping_config
                           })
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        transformed_data = data['transformed_data']
        summary = data['transformation_summary']
        
        print(f"Transformed {data['record_count']} records")
        print(f"Applied {summary['applied_mappings']} field mappings")
        
        print("Transformed data:")
        for i, record in enumerate(transformed_data):
            print(f"  Record {i+1}: {record}")
        
        return True
    else:
        print(f"Error: {response.text}")
        return False

def test_validate_mapping_endpoint(mapping_config):
    """Test validating a mapping configuration"""
    print("\nTesting /transformations/validate-mapping endpoint...")
    
    response = requests.post(f"{BASE_URL}/transformations/validate-mapping",
                           json={"mapping_data": mapping_config})
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        validation = data['validation']
        print(f"Mapping valid: {validation['valid']}")
        print(f"Errors: {len(validation['errors'])}")
        print(f"Warnings: {len(validation['warnings'])}")
        
        if validation['errors']:
            print("Errors:")
            for error in validation['errors']:
                print(f"  - {error}")
                
        if validation['warnings']:
            print("Warnings:")
            for warning in validation['warnings']:
                print(f"  - {warning}")
        
        return True
    else:
        print(f"Error: {response.text}")
        return False

def main():
    """Run all transformation endpoint tests"""
    print("=== IDXR Data Transformation Endpoints Test ===\n")
    
    try:
        # Test basic info endpoints
        success1 = test_field_types_endpoint()
        success2 = test_transformation_types_endpoint()
        success3 = test_field_suggestions_endpoint()
        
        # Test mapping creation and validation
        mapping_config = test_create_mapping_endpoint()
        
        if mapping_config:
            success4 = test_validate_mapping_endpoint(mapping_config)
            success5 = test_apply_transformations_endpoint(mapping_config)
        else:
            success4 = success5 = False
        
        # Summary
        total_tests = 5
        passed_tests = sum([success1, success2, success3, success4, success5])
        
        print(f"\n=== TEST SUMMARY ===")
        print(f"Passed: {passed_tests}/{total_tests}")
        print(f"Success rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("[SUCCESS] All transformation endpoints working correctly!")
        else:
            print("[FAILED] Some transformation endpoints need attention")
            
    except Exception as e:
        print(f"[ERROR] Test execution failed: {str(e)}")

if __name__ == "__main__":
    main()