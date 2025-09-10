#!/usr/bin/env python3
"""
Simple test script for all IDXR processing types (ASCII-only)
Tests all batch processing job types to ensure seamless integration
"""

import requests
import json
import time

def test_api_endpoint(method, endpoint, data=None, base_url="http://localhost:3000"):
    """Test API endpoint and return response"""
    url = f"{base_url}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url)
        elif method.upper() == "POST":
            response = requests.post(url, json=data)
        
        return {
            "success": response.status_code in [200, 201],
            "status_code": response.status_code,
            "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def test_processing_types():
    """Test all processing types"""
    print("Starting IDXR Processing Type Tests...")
    print("=" * 50)
    
    # Test data for different processing types
    test_identity_data = [
        {
            "record_id": "ID_001",
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1985-03-15",
            "ssn": "1234",
            "phone": "(303) 555-0123",
            "address": {"street": "123 Main St", "city": "Denver", "state": "CO", "zip": "80202"}
        }
    ]
    
    test_validation_data = [
        {
            "record_id": "VAL_001",
            "first_name": "John123",
            "last_name": "Doe",
            "email": "invalid-email",
            "phone": "not-a-phone"
        }
    ]
    
    # Test cases for each processing type
    test_cases = [
        {
            "name": "Identity Matching",
            "job_type": "identity_matching",
            "data": test_identity_data,
            "config": {"match_threshold": 0.80, "use_ai": True}
        },
        {
            "name": "Data Validation", 
            "job_type": "data_validation",
            "data": test_validation_data,
            "config": {"validation_level": "standard", "min_quality_threshold": 70.0}
        },
        {
            "name": "Data Quality",
            "job_type": "data_quality", 
            "data": test_identity_data,
            "config": {"apply_cleaning": True}
        },
        {
            "name": "Deduplication",
            "job_type": "deduplication",
            "data": test_identity_data + test_identity_data,  # Duplicate data
            "config": {"similarity_threshold": 0.85}
        },
        {
            "name": "Household Detection",
            "job_type": "household_detection",
            "data": test_identity_data,
            "config": {"address_grouping": True}
        },
        {
            "name": "Bulk Export",
            "job_type": "bulk_export",
            "data": test_identity_data,
            "config": {"export_format": "csv", "include_metadata": True}
        }
    ]
    
    results = {}
    
    for test_case in test_cases:
        print(f"Testing {test_case['name']}...")
        
        job_request = {
            "name": f"{test_case['name']} Test Job",
            "job_type": test_case["job_type"],
            "input_data": test_case["data"],
            "config": test_case["config"],
            "priority": "normal",
            "created_by": "test_user"
        }
        
        # Create job
        create_result = test_api_endpoint("POST", "/api/v1/batch/jobs", job_request)
        
        if create_result["success"]:
            job_id = create_result["data"]["job_id"]
            print(f"  Job created: {job_id}")
            
            # Wait and check status
            time.sleep(1)
            status_result = test_api_endpoint("GET", f"/api/v1/batch/jobs/{job_id}")
            
            if status_result["success"]:
                job_status = status_result["data"]["job"]["status"]
                print(f"  Job status: {job_status}")
                results[test_case["name"]] = {"success": True, "job_id": job_id, "status": job_status}
            else:
                print(f"  Failed to get job status")
                results[test_case["name"]] = {"success": False, "error": "Status check failed"}
        else:
            print(f"  Failed to create job: {create_result.get('error', 'Unknown error')}")
            results[test_case["name"]] = {"success": False, "error": create_result.get('error', 'Job creation failed')}
    
    return results

def test_existing_functionality():
    """Test existing core functionality"""
    print("\nTesting Existing Core Functionality...")
    print("-" * 30)
    
    results = {}
    
    # Test health endpoint
    print("Testing health check...")
    health_result = test_api_endpoint("GET", "/health")
    results["health"] = health_result["success"]
    print(f"  Health check: {'PASS' if health_result['success'] else 'FAIL'}")
    
    # Test statistics
    print("Testing statistics...")
    stats_result = test_api_endpoint("GET", "/api/v1/statistics")
    results["statistics"] = stats_result["success"]
    print(f"  Statistics: {'PASS' if stats_result['success'] else 'FAIL'}")
    
    # Test identity resolution
    print("Testing identity resolution...")
    resolve_data = {
        "demographic_data": {
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1985-03-15",
            "address": {"street": "123 Main St", "city": "Denver", "state": "CO", "zip": "80202"}
        },
        "source_system": "TEST_SYSTEM"
    }
    resolve_result = test_api_endpoint("POST", "/api/v1/resolve", resolve_data)
    results["resolve"] = resolve_result["success"]
    print(f"  Identity resolution: {'PASS' if resolve_result['success'] else 'FAIL'}")
    
    return results

def main():
    """Main test execution"""
    try:
        # Test all processing types
        processing_results = test_processing_types()
        
        # Test existing functionality  
        existing_results = test_existing_functionality()
        
        # Print summary
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        
        print("Processing Types:")
        processing_passed = 0
        for name, result in processing_results.items():
            status = "PASS" if result["success"] else "FAIL"
            print(f"  {name:20} {status}")
            if result["success"]:
                processing_passed += 1
        
        print("\nExisting Functionality:")
        existing_passed = 0
        for name, passed in existing_results.items():
            status = "PASS" if passed else "FAIL"
            print(f"  {name:20} {status}")
            if passed:
                existing_passed += 1
        
        total_processing = len(processing_results)
        total_existing = len(existing_results)
        
        print(f"\nProcessing Types: {processing_passed}/{total_processing} passed")
        print(f"Existing Functionality: {existing_passed}/{total_existing} passed")
        
        overall_success = (processing_passed == total_processing and existing_passed == total_existing)
        print(f"\nOverall Result: {'ALL TESTS PASSED' if overall_success else 'SOME TESTS FAILED'}")
        
        # Save results
        all_results = {
            "processing": processing_results,
            "existing": existing_results,
            "summary": {
                "processing_passed": processing_passed,
                "processing_total": total_processing,
                "existing_passed": existing_passed,
                "existing_total": total_existing,
                "overall_success": overall_success
            }
        }
        
        with open("test_results.json", "w") as f:
            json.dump(all_results, f, indent=2)
        print("\nResults saved to test_results.json")
        
        return 0 if overall_success else 1
        
    except Exception as e:
        print(f"Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())