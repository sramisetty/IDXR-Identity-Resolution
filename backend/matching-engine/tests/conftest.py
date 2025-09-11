"""
Pytest configuration and shared fixtures for comprehensive testing
"""

import pytest
import asyncio
import os
import tempfile
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from unittest.mock import Mock, AsyncMock, patch
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import application modules
from config.settings import AppConfig, DatabaseConfig, RedisConfig, SecurityConfig, MatchingConfig, MonitoringConfig
from utils.database import DatabaseConnection, IdentityRepository, MatchResultRepository, AuditLogRepository
from services.security_service import SecurityService, PrivacyService, ComplianceService
from services.admin_service import AdminService
from services.data_quality_service import DataQualityService
from services.reporting_service import ReportingService
from services.realtime_processor import RealtimeProcessor
from services.household_services import HouseholdDetector
from algorithms.deterministic import DeterministicMatcher
from algorithms.probabilistic import ProbabilisticMatcher
from algorithms.fuzzy import FuzzyMatcher
from algorithms.ai_hybrid import AIHybridMatcher

# Configure test environment
os.environ['DEMO_MODE'] = 'true'
os.environ['TESTING'] = 'true'
os.environ['LOG_LEVEL'] = 'ERROR'  # Reduce logging during tests

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def test_config() -> AppConfig:
    """Create test configuration"""
    return AppConfig(
        app_name="IDXR Test",
        environment="testing",
        debug=True,
        demo_mode=True,
        database=DatabaseConfig(
            host="localhost",
            port=5432,
            database="idxr_test",
            user="test_user",
            password="test_password"
        ),
        redis=RedisConfig(
            host="localhost",
            port=6379,
            database=1  # Use different DB for tests
        ),
        security=SecurityConfig(
            jwt_secret_key="test_secret_key_for_testing_only",
            jwt_expire_hours=1,
            max_login_attempts=3
        ),
        matching=MatchingConfig(
            enabled_algorithms=["deterministic", "probabilistic", "fuzzy"],
            default_confidence_threshold=0.85,
            batch_size=1000000,
            enable_ml_enhancement=False  # Disable for testing
        ),
        monitoring=MonitoringConfig(
            prometheus_enabled=False,
            health_check_enabled=True,
            distributed_tracing_enabled=False
        )
    )

@pytest.fixture
def mock_database():
    """Create mock database connection"""
    mock_db = Mock(spec=DatabaseConnection)
    mock_db.demo_mode = True
    mock_db.is_connected = True
    mock_db.check_connection = AsyncMock(return_value=True)
    return mock_db

@pytest.fixture
def sample_identity_data() -> Dict[str, Any]:
    """Sample identity data for testing"""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "middle_name": "Smith",
        "dob": "1985-03-15",
        "ssn": "123-45-6789",
        "driver_license": "CO12345678",
        "phone": "(303) 555-0123",
        "email": "john.doe@example.com",
        "address": {
            "street": "123 Main St",
            "city": "Denver",
            "state": "CO",
            "zip": "80202",
            "country": "US"
        },
        "source_system": "TEST_SYSTEM"
    }

@pytest.fixture
def sample_identity_variations() -> List[Dict[str, Any]]:
    """Multiple variations of the same identity for testing matching"""
    return [
        {
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1985-03-15",
            "ssn": "123456789",
            "phone": "3035550123",
            "address": {"street": "123 Main St", "city": "Denver", "state": "CO", "zip": "80202"}
        },
        {
            "first_name": "Jon",  # Slight misspelling
            "last_name": "Doe",
            "dob": "1985-03-15",
            "ssn": "123456789",
            "phone": "(303) 555-0123",
            "address": {"street": "123 Main Street", "city": "Denver", "state": "CO", "zip": "80202"}
        },
        {
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1985-03-15",
            "driver_license": "CO12345678",
            "phone": "303.555.0123",  # Different format
            "address": {"street": "123 Main St", "city": "Denver", "state": "Colorado", "zip": "80202-1234"}
        }
    ]

@pytest.fixture
def sample_household_identities() -> List[Dict[str, Any]]:
    """Sample household members for testing household detection"""
    return [
        {
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1980-05-15",
            "age": 44,
            "address": {"street": "123 Family St", "city": "Denver", "state": "CO", "zip": "80202"},
            "phone": "(303) 555-0123"
        },
        {
            "first_name": "Jane",
            "last_name": "Doe",
            "dob": "1982-08-22",
            "age": 42,
            "address": {"street": "123 Family St", "city": "Denver", "state": "CO", "zip": "80202"},
            "phone": "(303) 555-0124"
        },
        {
            "first_name": "Billy",
            "last_name": "Doe",
            "dob": "2010-12-03",
            "age": 14,
            "address": {"street": "123 Family St", "city": "Denver", "state": "CO", "zip": "80202"},
            "phone": "(303) 555-0123"  # Same as parent
        },
        {
            "first_name": "Sally",
            "last_name": "Doe",
            "dob": "2015-07-18",
            "age": 9,
            "address": {"street": "123 Family St", "city": "Denver", "state": "CO", "zip": "80202"},
            "phone": "(303) 555-0123"  # Same as parent
        }
    ]

@pytest.fixture
def colorado_test_data() -> Dict[str, Any]:
    """Colorado-specific test data"""
    return {
        "valid_zip_codes": ["80202", "80014", "81001", "80424"],
        "invalid_zip_codes": ["12345", "90210", "75001"],
        "valid_area_codes": ["303", "720", "970"],
        "invalid_area_codes": ["212", "415", "713"],
        "valid_counties": ["Adams", "Arapahoe", "Boulder", "Denver", "El Paso", "Jefferson"],
        "valid_cities": ["Denver", "Aurora", "Colorado Springs", "Lakewood", "Thornton", "Westminster"],
        "rural_addresses": [
            "RR 1 Box 123, Limon, CO 80828",
            "HC 64 Box 456, Craig, CO 81625"
        ],
        "military_addresses": [
            "1234 Military St, Fort Carson, CO 80913",
            "5678 Base Rd, Peterson AFB, CO 80914"
        ]
    }

# Service fixtures
@pytest.fixture
def security_service(test_config) -> SecurityService:
    """Create security service instance"""
    return SecurityService()

@pytest.fixture
def privacy_service(test_config) -> PrivacyService:
    """Create privacy service instance"""
    return PrivacyService()

@pytest.fixture
def compliance_service(test_config) -> ComplianceService:
    """Create compliance service instance"""
    return ComplianceService()

@pytest.fixture
def data_quality_service(test_config) -> DataQualityService:
    """Create data quality service instance"""
    return DataQualityService()

@pytest.fixture
def household_detector(test_config) -> HouseholdDetector:
    """Create household detector instance"""
    return HouseholdDetector()

@pytest.fixture
def reporting_service(test_config) -> ReportingService:
    """Create reporting service instance"""
    return ReportingService()

@pytest.fixture
def realtime_processor(test_config) -> RealtimeProcessor:
    """Create realtime processor instance"""
    return RealtimeProcessor()

@pytest.fixture
def admin_service(test_config) -> AdminService:
    """Create admin service instance"""
    return AdminService()

# Algorithm fixtures
@pytest.fixture
def deterministic_matcher() -> DeterministicMatcher:
    """Create deterministic matcher instance"""
    return DeterministicMatcher()

@pytest.fixture
def probabilistic_matcher() -> ProbabilisticMatcher:
    """Create probabilistic matcher instance"""
    return ProbabilisticMatcher()

@pytest.fixture
def fuzzy_matcher() -> FuzzyMatcher:
    """Create fuzzy matcher instance"""
    return FuzzyMatcher()

@pytest.fixture
def ai_hybrid_matcher() -> AIHybridMatcher:
    """Create AI hybrid matcher instance"""
    return AIHybridMatcher()

# Repository fixtures
@pytest.fixture
def identity_repository(mock_database) -> IdentityRepository:
    """Create identity repository instance"""
    return IdentityRepository(mock_database)

@pytest.fixture
def match_result_repository(mock_database) -> MatchResultRepository:
    """Create match result repository instance"""
    return MatchResultRepository(mock_database)

@pytest.fixture
def audit_log_repository(mock_database) -> AuditLogRepository:
    """Create audit log repository instance"""
    return AuditLogRepository(mock_database)

# Test utilities
@pytest.fixture
def temp_config_file():
    """Create temporary configuration file"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        config_data = {
            "app_name": "Test App",
            "environment": "testing",
            "debug": True,
            "database": {
                "host": "localhost",
                "port": 5432,
                "database": "test_db"
            }
        }
        import yaml
        yaml.dump(config_data, f)
        temp_file = f.name
    
    yield temp_file
    
    # Cleanup
    os.unlink(temp_file)

@pytest.fixture
def mock_redis():
    """Mock Redis connection"""
    with patch('redis.from_url') as mock_redis:
        mock_client = Mock()
        mock_client.ping.return_value = True
        mock_client.get.return_value = None
        mock_client.set.return_value = True
        mock_client.delete.return_value = True
        mock_client.exists.return_value = False
        mock_redis.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_prometheus_metrics():
    """Mock Prometheus metrics"""
    with patch('prometheus_client.Counter') as mock_counter, \
         patch('prometheus_client.Histogram') as mock_histogram, \
         patch('prometheus_client.Gauge') as mock_gauge:
        
        mock_counter.return_value.inc = Mock()
        mock_counter.return_value.labels.return_value.inc = Mock()
        
        mock_histogram.return_value.observe = Mock()
        mock_histogram.return_value.labels.return_value.observe = Mock()
        
        mock_gauge.return_value.set = Mock()
        mock_gauge.return_value.inc = Mock()
        mock_gauge.return_value.dec = Mock()
        
        yield {
            'counter': mock_counter,
            'histogram': mock_histogram,
            'gauge': mock_gauge
        }

# Performance testing utilities
class PerformanceTimer:
    """Context manager for measuring execution time"""
    
    def __init__(self):
        self.start_time = None
        self.end_time = None
        self.duration = None
    
    def __enter__(self):
        import time
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        self.end_time = time.time()
        self.duration = self.end_time - self.start_time

@pytest.fixture
def performance_timer():
    """Performance timing utility"""
    return PerformanceTimer

# Test data generators
class TestDataGenerator:
    """Generate test data for various scenarios"""
    
    @staticmethod
    def generate_identity(
        first_name: str = "Test",
        last_name: str = "User",
        variations: bool = False
    ) -> Dict[str, Any]:
        """Generate identity test data"""
        base_identity = {
            "first_name": first_name,
            "last_name": last_name,
            "dob": "1990-01-01",
            "ssn": "123456789",
            "phone": "(303) 555-0100",
            "email": f"{first_name.lower()}.{last_name.lower()}@example.com",
            "address": {
                "street": "100 Test St",
                "city": "Denver",
                "state": "CO",
                "zip": "80202"
            }
        }
        
        if variations:
            # Add some variations for fuzzy matching tests
            import random
            if random.random() < 0.3:
                base_identity["first_name"] = first_name[:-1] + random.choice("aeiou")
            if random.random() < 0.2:
                base_identity["phone"] = base_identity["phone"].replace("(", "").replace(")", "").replace(" ", "-")
        
        return base_identity
    
    @staticmethod
    def generate_batch_identities(count: int = 100) -> List[Dict[str, Any]]:
        """Generate batch of test identities"""
        identities = []
        for i in range(count):
            identity = TestDataGenerator.generate_identity(
                first_name=f"User{i}",
                last_name=f"Test{i % 10}",
                variations=i % 5 == 0  # Add variations to every 5th record
            )
            identities.append(identity)
        return identities

@pytest.fixture
def test_data_generator():
    """Test data generator utility"""
    return TestDataGenerator

# Async test helpers
def async_test(coro):
    """Decorator to run async tests"""
    def wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro(*args, **kwargs))
    return wrapper

# Database test helpers
@pytest.fixture
def clean_database():
    """Ensure clean database state for tests"""
    # In demo mode, this is handled by mocks
    # In real testing, you might truncate tables here
    yield
    # Cleanup after test

# Security test helpers
@pytest.fixture
def test_user_credentials():
    """Test user credentials"""
    return {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "TestPassword123!",
        "role": "analyst"
    }

@pytest.fixture
def test_admin_credentials():
    """Test admin credentials"""
    return {
        "username": "testadmin",
        "email": "testadmin@example.com",
        "password": "AdminPassword123!",
        "role": "admin"
    }

# Parameterized test data
@pytest.fixture(params=[
    {"algorithm": "deterministic", "threshold": 1.0},
    {"algorithm": "probabilistic", "threshold": 0.85},
    {"algorithm": "fuzzy", "threshold": 0.75}
])
def algorithm_test_params(request):
    """Parameterized algorithm test data"""
    return request.param

@pytest.fixture(params=[
    {"quality": "excellent", "score": 0.95},
    {"quality": "good", "score": 0.85},
    {"quality": "fair", "score": 0.75},
    {"quality": "poor", "score": 0.65}
])
def data_quality_test_params(request):
    """Parameterized data quality test data"""
    return request.param

# Error injection for testing
@pytest.fixture
def error_injector():
    """Utility for injecting errors in tests"""
    class ErrorInjector:
        def __init__(self):
            self.patches = []
        
        def inject_database_error(self, exception=Exception("Database error")):
            patch_obj = patch('utils.database.DatabaseConnection.check_connection', 
                            side_effect=exception)
            self.patches.append(patch_obj)
            return patch_obj.start()
        
        def inject_redis_error(self, exception=Exception("Redis error")):
            patch_obj = patch('redis.Redis.ping', side_effect=exception)
            self.patches.append(patch_obj)
            return patch_obj.start()
        
        def cleanup(self):
            for patch_obj in self.patches:
                patch_obj.stop()
            self.patches.clear()
    
    injector = ErrorInjector()
    yield injector
    injector.cleanup()

# Test markers for categorizing tests
def pytest_configure(config):
    """Configure pytest markers"""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "performance: Performance tests")
    config.addinivalue_line("markers", "security: Security tests")
    config.addinivalue_line("markers", "slow: Slow running tests")
    config.addinivalue_line("markers", "colorado: Colorado-specific tests")
    config.addinivalue_line("markers", "compliance: Compliance-related tests")

# Test collection hooks
def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    # Mark slow tests
    for item in items:
        if "performance" in item.keywords:
            item.add_marker(pytest.mark.slow)
        
        # Skip integration tests if database not available
        if "integration" in item.keywords and os.getenv('SKIP_INTEGRATION_TESTS'):
            item.add_marker(pytest.mark.skip(reason="Integration tests disabled"))

# Test reporting hooks
def pytest_runtest_makereport(item, call):
    """Create test reports with additional information"""
    if call.when == "call":
        # Add performance information to test reports
        if hasattr(item, 'performance_data'):
            call.result.performance = item.performance_data