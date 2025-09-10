#!/usr/bin/env python3
"""
Comprehensive test script for all IDXR processing types
Tests all batch processing job types to ensure seamless integration
"""

import asyncio
import json
import time
import requests
from typing import Dict, List, Any

class IDXRComprehensiveTest:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.test_results = {}
        
    def test_api_endpoint(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Test API endpoint and return response"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url)
            elif method.upper() == "POST":
                response = requests.post(url, json=data)
            elif method.upper() == "DELETE":
                response = requests.delete(url)
            
            return {
                "success": response.status_code in [200, 201],
                "status_code": response.status_code,
                "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "status_code": None,
                "data": None,
                "error": str(e)
            }

    def test_identity_matching_job(self) -> Dict:
        """Test identity matching batch job"""
        print("[IDENTITY] Testing Identity Matching Job...")
        
        test_data = [
            {
                "record_id": "IDM_001",
                "first_name": "John",
                "last_name": "Doe",
                "dob": "1985-03-15",
                "ssn": "1234",
                "phone": "(303) 555-0123",
                "email": "john.doe@example.com",
                "address": {
                    "street": "123 Main St",
                    "city": "Denver",
                    "state": "CO",
                    "zip": "80202"
                }
            },
            {
                "record_id": "IDM_002",
                "first_name": "Jane",
                "last_name": "Smith",
                "dob": "1990-07-22",
                "ssn": "5678",
                "phone": "(303) 555-0456",
                "email": "jane.smith@example.com",
                "address": {
                    "street": "456 Oak Ave",
                    "city": "Boulder",
                    "state": "CO",
                    "zip": "80301"
                }
            }
        ]
        
        job_request = {
            "name": "Identity Matching Test Job",
            "job_type": "identity_matching",
            "input_data": test_data,
            "config": {
                "match_threshold": 0.80,
                "use_ai": True,
                "algorithms": ["deterministic", "probabilistic", "ai_hybrid"]
            },
            "priority": "normal",
            "created_by": "test_user"
        }
        
        # Create job
        create_result = self.test_api_endpoint("POST", "/api/v1/batch/jobs", job_request)
        if not create_result["success"]:
            return {"success": False, "error": "Failed to create identity matching job", "details": create_result}
        
        job_id = create_result["data"]["job_id"]
        
        # Wait a moment and check status
        time.sleep(2)
        status_result = self.test_api_endpoint("GET", f"/api/v1/batch/jobs/{job_id}")
        
        return {
            "success": True,
            "job_id": job_id,
            "job_created": create_result["success"],
            "status_check": status_result["success"],
            "job_status": status_result["data"]["job"]["status"] if status_result["success"] else None
        }

    def test_data_validation_job(self) -> Dict:
        """Test data validation batch job"""
        print("[VALIDATION] Testing Data Validation Job...")
        
        test_data = [
            {
                "record_id": "VAL_001",
                "first_name": "John123",  # Invalid - contains numbers
                "last_name": "Doe",
                "dob": "1985-03-15",
                "ssn": "000-00-0000",  # Invalid SSN pattern
                "phone": "not-a-phone",  # Invalid phone format
                "email": "invalid-email",  # Invalid email format
                "address": {
                    "street": "123 Main St",
                    "city": "Denver",
                    "state": "CO",
                    "zip": "12345"  # Invalid CO ZIP
                }
            },
            {
                "record_id": "VAL_002",
                "first_name": "Jane",
                "last_name": "Smith",
                "dob": "1990-07-22",
                "ssn": "123-45-6789",
                "phone": "(303) 555-0456",
                "email": "jane.smith@gmail.com",
                "address": {
                    "street": "456 Oak Ave",
                    "city": "Boulder",
                    "state": "CO",
                    "zip": "80301"
                }
            }
        ]
        
        job_request = {
            "name": "Data Validation Test Job",
            "job_type": "data_validation",
            "input_data": test_data,
            "config": {
                "validation_level": "comprehensive",
                "min_quality_threshold": 70.0
            },
            "priority": "normal",
            "created_by": "test_user"
        }
        
        create_result = self.test_api_endpoint("POST", "/api/v1/batch/jobs", job_request)
        if not create_result["success"]:
            return {"success": False, "error": "Failed to create data validation job", "details": create_result}
        
        job_id = create_result["data"]["job_id"]
        time.sleep(2)
        status_result = self.test_api_endpoint("GET", f"/api/v1/batch/jobs/{job_id}")
        
        return {
            "success": True,
            "job_id": job_id,
            "job_created": create_result["success"],
            "status_check": status_result["success"],
            "job_status": status_result["data"]["job"]["status"] if status_result["success"] else None
        }

    def test_data_quality_job(self) -> Dict:
        """Test data quality assessment batch job"""
        print("📊 Testing Data Quality Job...")
        
        test_data = [
            {
                "record_id": "DQ_001",
                "first_name": "john",  # Poor capitalization
                "last_name": "DOE",   # Poor capitalization
                "dob": "03/15/1985",  # Non-standard date format
                "ssn": "123456789",   # Unformatted SSN
                "phone": "3035550123", # Unformatted phone
                "email": "john@EXAMPLE.COM", # Mixed case email
                "address": {
                    "street": "123 main street",  # Poor capitalization
                    "city": "denver",
                    "state": "colorado",  # Full state name instead of code
                    "zip": "80202-1234"
                }
            }
        ]
        
        job_request = {
            "name": "Data Quality Assessment Test Job",
            "job_type": "data_quality",
            "input_data": test_data,
            "config": {
                "apply_cleaning": True,
                "validation_level": "enhanced"
            },
            "priority": "normal",
            "created_by": "test_user"
        }
        
        create_result = self.test_api_endpoint("POST", "/api/v1/batch/jobs", job_request)
        if not create_result["success"]:
            return {"success": False, "error": "Failed to create data quality job", "details": create_result}
        
        job_id = create_result["data"]["job_id"]
        time.sleep(2)
        status_result = self.test_api_endpoint("GET", f"/api/v1/batch/jobs/{job_id}")
        
        return {
            "success": True,
            "job_id": job_id,
            "job_created": create_result["success"],
            "status_check": status_result["success"],
            "job_status": status_result["data"]["job"]["status"] if status_result["success"] else None
        }

    def test_deduplication_job(self) -> Dict:
        """Test deduplication batch job"""
        print("🔄 Testing Deduplication Job...")
        
        test_data = [
            {
                "record_id": "DUP_001",
                "first_name": "John",
                "last_name": "Doe",
                "dob": "1985-03-15",
                "ssn": "1234",
                "phone": "(303) 555-0123",
                "email": "john.doe@example.com"
            },
            {
                "record_id": "DUP_002",
                "first_name": "John",
                "last_name": "Doe",
                "dob": "1985-03-15",
                "ssn": "1234",
                "phone": "(303) 555-0123",
                "email": "j.doe@example.com"  # Slightly different email
            },
            {
                "record_id": "DUP_003",
                "first_name": "Jane",
                "last_name": "Smith",
                "dob": "1990-07-22",
                "ssn": "5678",
                "phone": "(303) 555-0456",
                "email": "jane.smith@example.com"
            }
        ]
        
        job_request = {
            "name": "Deduplication Test Job",
            "job_type": "deduplication",
            "input_data": test_data,
            "config": {
                "similarity_threshold": 0.85,
                "algorithms": ["deterministic", "probabilistic"]
            },
            "priority": "normal",
            "created_by": "test_user"
        }
        
        create_result = self.test_api_endpoint("POST", "/api/v1/batch/jobs", job_request)
        if not create_result["success"]:
            return {"success": False, "error": "Failed to create deduplication job", "details": create_result}
        
        job_id = create_result["data"]["job_id"]
        time.sleep(2)
        status_result = self.test_api_endpoint("GET", f"/api/v1/batch/jobs/{job_id}")
        
        return {
            "success": True,
            "job_id": job_id,
            "job_created": create_result["success"],
            "status_check": status_result["success"],
            "job_status": status_result["data"]["job"]["status"] if status_result["success"] else None
        }

    def test_household_detection_job(self) -> Dict:
        """Test household detection batch job"""
        print("🏠 Testing Household Detection Job...")
        
        test_data = [
            {
                "record_id": "HH_001",
                "first_name": "John",
                "last_name": "Doe",
                "dob": "1985-03-15",
                "phone": "(303) 555-0123",
                "address": {
                    "street": "123 Main St",
                    "city": "Denver",
                    "state": "CO",
                    "zip": "80202"
                }
            },
            {
                "record_id": "HH_002",
                "first_name": "Jane",
                "last_name": "Doe",
                "dob": "1987-08-20",
                "phone": "(303) 555-0124",
                "address": {
                    "street": "123 Main St",
                    "city": "Denver",
                    "state": "CO",
                    "zip": "80202"
                }
            },
            {
                "record_id": "HH_003",
                "first_name": "Billy",
                "last_name": "Doe",
                "dob": "2010-12-01",
                "address": {
                    "street": "123 Main St",
                    "city": "Denver",
                    "state": "CO",
                    "zip": "80202"
                }
            }
        ]
        
        job_request = {
            "name": "Household Detection Test Job",
            "job_type": "household_detection",
            "input_data": test_data,
            "config": {
                "address_grouping": True,
                "name_pattern_analysis": True
            },
            "priority": "normal",
            "created_by": "test_user"
        }
        
        create_result = self.test_api_endpoint("POST", "/api/v1/batch/jobs", job_request)
        if not create_result["success"]:
            return {"success": False, "error": "Failed to create household detection job", "details": create_result}
        
        job_id = create_result["data"]["job_id"]
        time.sleep(2)
        status_result = self.test_api_endpoint("GET", f"/api/v1/batch/jobs/{job_id}")
        
        return {
            "success": True,
            "job_id": job_id,
            "job_created": create_result["success"],
            "status_check": status_result["success"],
            "job_status": status_result["data"]["job"]["status"] if status_result["success"] else None
        }

    def test_bulk_export_job(self) -> Dict:
        """Test bulk export batch job"""
        print("📤 Testing Bulk Export Job...")
        
        test_data = [
            {
                "record_id": "EXP_001",
                "first_name": "John",
                "last_name": "Doe",
                "dob": "1985-03-15",
                "ssn": "123-45-6789",
                "phone": "(303) 555-0123",
                "email": "john.doe@example.com",
                "address": {
                    "street": "123 Main St",
                    "city": "Denver",
                    "state": "CO",
                    "zip": "80202"
                }
            },
            {
                "record_id": "EXP_002",
                "first_name": "Jane",
                "last_name": "Smith",
                "dob": "1990-07-22",
                "ssn": "987-65-4321",
                "phone": "(303) 555-0456",
                "email": "jane.smith@example.com"
            }
        ]
        
        job_request = {
            "name": "Bulk Export Test Job",
            "job_type": "bulk_export",
            "input_data": test_data,
            "config": {
                "export_format": "csv",
                "field_mappings": {
                    "first_name": "FirstName",
                    "last_name": "LastName",
                    "dob": "DateOfBirth",
                    "phone": "PhoneNumber",
                    "email": "EmailAddress"
                },
                "include_metadata": True,
                "anonymize_fields": ["ssn"]
            },
            "priority": "normal",
            "created_by": "test_user"
        }
        
        create_result = self.test_api_endpoint("POST", "/api/v1/batch/jobs", job_request)
        if not create_result["success"]:
            return {"success": False, "error": "Failed to create bulk export job", "details": create_result}
        
        job_id = create_result["data"]["job_id"]
        time.sleep(2)
        status_result = self.test_api_endpoint("GET", f"/api/v1/batch/jobs/{job_id}")
        
        return {
            "success": True,
            "job_id": job_id,
            "job_created": create_result["success"],
            "status_check": status_result["success"],
            "job_status": status_result["data"]["job"]["status"] if status_result["success"] else None
        }

    def test_existing_functionality(self) -> Dict:
        """Test existing core functionality to ensure it's not broken"""
        print("🔧 Testing Existing Core Functionality...")
        
        results = {}
        
        # Test health endpoint
        health_result = self.test_api_endpoint("GET", "/health")
        results["health_check"] = health_result["success"]
        
        # Test statistics endpoint
        stats_result = self.test_api_endpoint("GET", "/api/v1/statistics")
        results["statistics"] = stats_result["success"]
        
        # Test identity resolution endpoint
        resolve_data = {
            "demographic_data": {
                "first_name": "John",
                "last_name": "Doe",
                "dob": "1985-03-15",
                "ssn_last4": "1234",
                "address": {
                    "street": "123 Main St",
                    "city": "Denver",
                    "state": "CO",
                    "zip": "80202"
                }
            },
            "source_system": "TEST_SYSTEM",
            "transaction_id": "TEST_TRANSACTION_001"
        }
        resolve_result = self.test_api_endpoint("POST", "/api/v1/resolve", resolve_data)
        results["identity_resolution"] = resolve_result["success"]
        
        # Test batch job listing
        list_result = self.test_api_endpoint("GET", "/api/v1/batch/jobs")
        results["batch_job_listing"] = list_result["success"]
        
        return {
            "success": all(results.values()),
            "individual_results": results,
            "total_tests": len(results),
            "passed_tests": sum(results.values())
        }

    def run_comprehensive_test(self) -> Dict:
        """Run all comprehensive tests"""
        print("🚀 Starting IDXR Comprehensive Processing Test Suite...")
        print("=" * 60)
        
        start_time = time.time()
        test_results = {}
        
        # Test all processing types
        test_results["identity_matching"] = self.test_identity_matching_job()
        test_results["data_validation"] = self.test_data_validation_job()
        test_results["data_quality"] = self.test_data_quality_job()
        test_results["deduplication"] = self.test_deduplication_job()
        test_results["household_detection"] = self.test_household_detection_job()
        test_results["bulk_export"] = self.test_bulk_export_job()
        
        # Test existing functionality
        test_results["existing_functionality"] = self.test_existing_functionality()
        
        end_time = time.time()
        
        # Calculate summary
        processing_tests = [
            "identity_matching", "data_validation", "data_quality", 
            "deduplication", "household_detection", "bulk_export"
        ]
        
        processing_success_count = sum(1 for test in processing_tests if test_results[test]["success"])
        existing_functionality_passed = test_results["existing_functionality"]["passed_tests"]
        existing_functionality_total = test_results["existing_functionality"]["total_tests"]
        
        summary = {
            "total_test_time_seconds": round(end_time - start_time, 2),
            "processing_types_tested": len(processing_tests),
            "processing_types_successful": processing_success_count,
            "existing_functionality_tests": existing_functionality_total,
            "existing_functionality_passed": existing_functionality_passed,
            "overall_success": (processing_success_count == len(processing_tests) and 
                              existing_functionality_passed == existing_functionality_total),
            "test_results": test_results
        }
        
        return summary

    def print_test_summary(self, results: Dict):
        """Print formatted test summary"""
        print("\n" + "=" * 60)
        print("📋 COMPREHENSIVE TEST RESULTS SUMMARY")
        print("=" * 60)
        
        print(f"⏱️  Total Test Time: {results['total_test_time_seconds']} seconds")
        print(f"🔄 Processing Types Tested: {results['processing_types_tested']}")
        print(f"✅ Processing Types Successful: {results['processing_types_successful']}")
        print(f"🔧 Existing Functionality Tests: {results['existing_functionality_passed']}/{results['existing_functionality_tests']}")
        print(f"🎯 Overall Success: {'✅ PASS' if results['overall_success'] else '❌ FAIL'}")
        
        print("\n📊 DETAILED RESULTS:")
        print("-" * 40)
        
        processing_tests = [
            ("Identity Matching", "identity_matching"),
            ("Data Validation", "data_validation"),
            ("Data Quality", "data_quality"),
            ("Deduplication", "deduplication"),
            ("Household Detection", "household_detection"),
            ("Bulk Export", "bulk_export")
        ]
        
        for name, key in processing_tests:
            result = results["test_results"][key]
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            job_id = result.get("job_id", "N/A")
            job_status = result.get("job_status", "N/A")
            print(f"  {name:20} {status:8} (Job: {job_id[:20]}, Status: {job_status})")
        
        print("\n🔧 EXISTING FUNCTIONALITY:")
        print("-" * 40)
        existing_results = results["test_results"]["existing_functionality"]["individual_results"]
        for test_name, passed in existing_results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {test_name.replace('_', ' ').title():20} {status}")
        
        if results['overall_success']:
            print("\n🎉 ALL TESTS PASSED! Integration is successful!")
        else:
            print("\n⚠️  Some tests failed. Check the results above for details.")
        
        print("=" * 60)

def main():
    """Main test execution"""
    tester = IDXRComprehensiveTest()
    
    try:
        results = tester.run_comprehensive_test()
        tester.print_test_summary(results)
        
        # Save results to file
        with open("comprehensive_test_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Detailed results saved to: comprehensive_test_results.json")
        
        # Exit with appropriate code
        exit(0 if results["overall_success"] else 1)
        
    except Exception as e:
        print(f"\n❌ Test execution failed: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()