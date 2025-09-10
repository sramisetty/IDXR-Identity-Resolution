"""
Enterprise Configuration Management System
Provides comprehensive configuration handling with environment variables, 
validation, and runtime configuration updates
"""

import os
import json
import yaml
import logging
from typing import Dict, List, Optional, Any, Union, Type
from dataclasses import dataclass, field, fields
from enum import Enum
from pathlib import Path
import secrets
from datetime import datetime

class Environment(Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"

class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

@dataclass
class DatabaseConfig:
    """Database configuration settings"""
    host: str = "localhost"
    port: int = 5432
    database: str = "idxr"
    user: str = "idxr_user"
    password: str = "idxr_password"
    pool_size: int = 20
    max_overflow: int = 30
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False
    ssl_mode: str = "prefer"
    connection_timeout: int = 10
    command_timeout: int = 60
    
    @classmethod
    def from_env(cls) -> 'DatabaseConfig':
        """Create database config from environment variables"""
        return cls(
            host=os.getenv('DB_HOST', cls.host),
            port=int(os.getenv('DB_PORT', str(cls.port))),
            database=os.getenv('DB_NAME', cls.database),
            user=os.getenv('DB_USER', cls.user),
            password=os.getenv('DB_PASSWORD', cls.password),
            pool_size=int(os.getenv('DB_POOL_SIZE', str(cls.pool_size))),
            max_overflow=int(os.getenv('DB_MAX_OVERFLOW', str(cls.max_overflow))),
            pool_timeout=int(os.getenv('DB_POOL_TIMEOUT', str(cls.pool_timeout))),
            pool_recycle=int(os.getenv('DB_POOL_RECYCLE', str(cls.pool_recycle))),
            echo=os.getenv('DB_ECHO', 'false').lower() == 'true',
            ssl_mode=os.getenv('DB_SSL_MODE', cls.ssl_mode),
            connection_timeout=int(os.getenv('DB_CONNECTION_TIMEOUT', str(cls.connection_timeout))),
            command_timeout=int(os.getenv('DB_COMMAND_TIMEOUT', str(cls.command_timeout)))
        )
    
    def get_connection_string(self, async_driver: bool = False) -> str:
        """Generate database connection string"""
        driver = "postgresql+asyncpg" if async_driver else "postgresql"
        return f"{driver}://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"

@dataclass
class RedisConfig:
    """Redis configuration settings"""
    host: str = "localhost"
    port: int = 6379
    database: int = 0
    password: Optional[str] = None
    ssl: bool = False
    ssl_cert_reqs: str = "required"
    connection_pool_size: int = 10
    socket_timeout: int = 5
    socket_connect_timeout: int = 5
    health_check_interval: int = 30
    
    @classmethod
    def from_env(cls) -> 'RedisConfig':
        """Create Redis config from environment variables"""
        return cls(
            host=os.getenv('REDIS_HOST', cls.host),
            port=int(os.getenv('REDIS_PORT', str(cls.port))),
            database=int(os.getenv('REDIS_DB', str(cls.database))),
            password=os.getenv('REDIS_PASSWORD'),
            ssl=os.getenv('REDIS_SSL', 'false').lower() == 'true',
            ssl_cert_reqs=os.getenv('REDIS_SSL_CERT_REQS', cls.ssl_cert_reqs),
            connection_pool_size=int(os.getenv('REDIS_POOL_SIZE', str(cls.connection_pool_size))),
            socket_timeout=int(os.getenv('REDIS_SOCKET_TIMEOUT', str(cls.socket_timeout))),
            socket_connect_timeout=int(os.getenv('REDIS_CONNECT_TIMEOUT', str(cls.socket_connect_timeout))),
            health_check_interval=int(os.getenv('REDIS_HEALTH_CHECK_INTERVAL', str(cls.health_check_interval)))
        )
    
    def get_connection_url(self) -> str:
        """Generate Redis connection URL"""
        scheme = "rediss" if self.ssl else "redis"
        auth = f":{self.password}@" if self.password else ""
        return f"{scheme}://{auth}{self.host}:{self.port}/{self.database}"

@dataclass
class SecurityConfig:
    """Security configuration settings"""
    jwt_secret_key: str = field(default_factory=lambda: secrets.token_urlsafe(32))
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    jwt_refresh_expire_days: int = 7
    password_min_length: int = 12
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_numbers: bool = True
    password_require_special: bool = True
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 15
    session_timeout_minutes: int = 60
    encryption_key: Optional[str] = None
    rate_limit_enabled: bool = True
    cors_origins: List[str] = field(default_factory=lambda: ["*"])
    cors_credentials: bool = True
    security_headers: bool = True
    
    @classmethod
    def from_env(cls) -> 'SecurityConfig':
        """Create security config from environment variables"""
        cors_origins = os.getenv('CORS_ORIGINS', '*').split(',')
        
        return cls(
            jwt_secret_key=os.getenv('JWT_SECRET_KEY') or secrets.token_urlsafe(32),
            jwt_algorithm=os.getenv('JWT_ALGORITHM', cls.jwt_algorithm),
            jwt_expire_hours=int(os.getenv('JWT_EXPIRE_HOURS', str(cls.jwt_expire_hours))),
            jwt_refresh_expire_days=int(os.getenv('JWT_REFRESH_EXPIRE_DAYS', str(cls.jwt_refresh_expire_days))),
            password_min_length=int(os.getenv('PASSWORD_MIN_LENGTH', str(cls.password_min_length))),
            password_require_uppercase=os.getenv('PASSWORD_REQUIRE_UPPERCASE', 'true').lower() == 'true',
            password_require_lowercase=os.getenv('PASSWORD_REQUIRE_LOWERCASE', 'true').lower() == 'true',
            password_require_numbers=os.getenv('PASSWORD_REQUIRE_NUMBERS', 'true').lower() == 'true',
            password_require_special=os.getenv('PASSWORD_REQUIRE_SPECIAL', 'true').lower() == 'true',
            max_login_attempts=int(os.getenv('MAX_LOGIN_ATTEMPTS', str(cls.max_login_attempts))),
            lockout_duration_minutes=int(os.getenv('LOCKOUT_DURATION_MINUTES', str(cls.lockout_duration_minutes))),
            session_timeout_minutes=int(os.getenv('SESSION_TIMEOUT_MINUTES', str(cls.session_timeout_minutes))),
            encryption_key=os.getenv('ENCRYPTION_KEY'),
            rate_limit_enabled=os.getenv('RATE_LIMIT_ENABLED', 'true').lower() == 'true',
            cors_origins=cors_origins,
            cors_credentials=os.getenv('CORS_CREDENTIALS', 'true').lower() == 'true',
            security_headers=os.getenv('SECURITY_HEADERS', 'true').lower() == 'true'
        )

@dataclass
class MatchingConfig:
    """Identity matching algorithm configuration"""
    enabled_algorithms: List[str] = field(default_factory=lambda: ["deterministic", "probabilistic", "ai_hybrid", "fuzzy"])
    default_confidence_threshold: float = 0.85
    auto_match_threshold: float = 0.95
    manual_review_threshold: float = 0.70
    batch_size: int = 1000
    max_matches_returned: int = 10
    enable_caching: bool = True
    cache_ttl_seconds: int = 300
    enable_ml_enhancement: bool = True
    ml_model_path: str = "models/identity_matcher_v2.1.pkl"
    fuzzy_max_distance: int = 3
    soundex_enabled: bool = True
    metaphone_enabled: bool = True
    jaro_winkler_threshold: float = 0.85
    
    # Algorithm weights for ensemble scoring
    deterministic_weight: float = 0.4
    probabilistic_weight: float = 0.3
    ai_hybrid_weight: float = 0.2
    fuzzy_weight: float = 0.1
    
    # Edge case detection settings
    twins_detection_enabled: bool = True
    children_handling_enabled: bool = True
    homeless_population_handling: bool = True
    data_anomaly_detection: bool = True
    
    @classmethod
    def from_env(cls) -> 'MatchingConfig':
        """Create matching config from environment variables"""
        algorithms = os.getenv('MATCHING_ALGORITHMS', 'deterministic,probabilistic,ai_hybrid,fuzzy').split(',')
        
        return cls(
            enabled_algorithms=algorithms,
            default_confidence_threshold=float(os.getenv('DEFAULT_CONFIDENCE_THRESHOLD', str(cls.default_confidence_threshold))),
            auto_match_threshold=float(os.getenv('AUTO_MATCH_THRESHOLD', str(cls.auto_match_threshold))),
            manual_review_threshold=float(os.getenv('MANUAL_REVIEW_THRESHOLD', str(cls.manual_review_threshold))),
            batch_size=int(os.getenv('MATCHING_BATCH_SIZE', str(cls.batch_size))),
            max_matches_returned=int(os.getenv('MAX_MATCHES_RETURNED', str(cls.max_matches_returned))),
            enable_caching=os.getenv('MATCHING_CACHE_ENABLED', 'true').lower() == 'true',
            cache_ttl_seconds=int(os.getenv('MATCHING_CACHE_TTL', str(cls.cache_ttl_seconds))),
            enable_ml_enhancement=os.getenv('ML_ENHANCEMENT_ENABLED', 'true').lower() == 'true',
            ml_model_path=os.getenv('ML_MODEL_PATH', cls.ml_model_path),
            fuzzy_max_distance=int(os.getenv('FUZZY_MAX_DISTANCE', str(cls.fuzzy_max_distance))),
            soundex_enabled=os.getenv('SOUNDEX_ENABLED', 'true').lower() == 'true',
            metaphone_enabled=os.getenv('METAPHONE_ENABLED', 'true').lower() == 'true',
            jaro_winkler_threshold=float(os.getenv('JARO_WINKLER_THRESHOLD', str(cls.jaro_winkler_threshold))),
            deterministic_weight=float(os.getenv('DETERMINISTIC_WEIGHT', str(cls.deterministic_weight))),
            probabilistic_weight=float(os.getenv('PROBABILISTIC_WEIGHT', str(cls.probabilistic_weight))),
            ai_hybrid_weight=float(os.getenv('AI_HYBRID_WEIGHT', str(cls.ai_hybrid_weight))),
            fuzzy_weight=float(os.getenv('FUZZY_WEIGHT', str(cls.fuzzy_weight))),
            twins_detection_enabled=os.getenv('TWINS_DETECTION_ENABLED', 'true').lower() == 'true',
            children_handling_enabled=os.getenv('CHILDREN_HANDLING_ENABLED', 'true').lower() == 'true',
            homeless_population_handling=os.getenv('HOMELESS_POPULATION_HANDLING', 'true').lower() == 'true',
            data_anomaly_detection=os.getenv('DATA_ANOMALY_DETECTION', 'true').lower() == 'true'
        )

@dataclass
class MonitoringConfig:
    """Monitoring and observability configuration"""
    prometheus_enabled: bool = True
    prometheus_port: int = 9090
    metrics_collection_interval: int = 30
    health_check_enabled: bool = True
    health_check_interval: int = 60
    distributed_tracing_enabled: bool = True
    log_level: LogLevel = LogLevel.INFO
    log_format: str = "json"
    log_file: Optional[str] = None
    max_log_file_size: int = 100  # MB
    log_retention_days: int = 30
    alert_webhook_url: Optional[str] = None
    alert_thresholds: Dict[str, Dict[str, float]] = field(default_factory=lambda: {
        'cpu_usage': {'warning': 75.0, 'critical': 90.0},
        'memory_usage': {'warning': 80.0, 'critical': 95.0},
        'disk_usage': {'warning': 85.0, 'critical': 95.0},
        'response_time': {'warning': 1000.0, 'critical': 5000.0},
        'error_rate': {'warning': 1.0, 'critical': 5.0}
    })
    
    @classmethod
    def from_env(cls) -> 'MonitoringConfig':
        """Create monitoring config from environment variables"""
        alert_thresholds = cls.alert_thresholds.copy()
        
        # Allow override of alert thresholds from environment
        for metric in alert_thresholds:
            warning_key = f"ALERT_{metric.upper()}_WARNING"
            critical_key = f"ALERT_{metric.upper()}_CRITICAL"
            
            if os.getenv(warning_key):
                alert_thresholds[metric]['warning'] = float(os.getenv(warning_key))
            if os.getenv(critical_key):
                alert_thresholds[metric]['critical'] = float(os.getenv(critical_key))
        
        return cls(
            prometheus_enabled=os.getenv('PROMETHEUS_ENABLED', 'true').lower() == 'true',
            prometheus_port=int(os.getenv('PROMETHEUS_PORT', str(cls.prometheus_port))),
            metrics_collection_interval=int(os.getenv('METRICS_COLLECTION_INTERVAL', str(cls.metrics_collection_interval))),
            health_check_enabled=os.getenv('HEALTH_CHECK_ENABLED', 'true').lower() == 'true',
            health_check_interval=int(os.getenv('HEALTH_CHECK_INTERVAL', str(cls.health_check_interval))),
            distributed_tracing_enabled=os.getenv('DISTRIBUTED_TRACING_ENABLED', 'true').lower() == 'true',
            log_level=LogLevel(os.getenv('LOG_LEVEL', cls.log_level.value)),
            log_format=os.getenv('LOG_FORMAT', cls.log_format),
            log_file=os.getenv('LOG_FILE'),
            max_log_file_size=int(os.getenv('MAX_LOG_FILE_SIZE', str(cls.max_log_file_size))),
            log_retention_days=int(os.getenv('LOG_RETENTION_DAYS', str(cls.log_retention_days))),
            alert_webhook_url=os.getenv('ALERT_WEBHOOK_URL'),
            alert_thresholds=alert_thresholds
        )

@dataclass
class AppConfig:
    """Main application configuration"""
    # Application settings
    app_name: str = "IDXR Identity Cross-Resolution System"
    app_version: str = "2.1.0"
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    reload: bool = False
    
    # Demo mode for testing without external dependencies
    demo_mode: bool = True
    
    # Component configurations
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    redis: RedisConfig = field(default_factory=RedisConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    matching: MatchingConfig = field(default_factory=MatchingConfig)
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    
    # Feature flags
    features: Dict[str, bool] = field(default_factory=lambda: {
        'advanced_matching': True,
        'household_detection': True,
        'real_time_processing': True,
        'data_quality_checks': True,
        'comprehensive_reporting': True,
        'admin_interface': True,
        'api_rate_limiting': True,
        'security_monitoring': True,
        'compliance_tracking': True
    })
    
    # External service configurations
    external_services: Dict[str, Dict[str, Any]] = field(default_factory=lambda: {
        'address_validation': {
            'enabled': False,
            'provider': 'usps',
            'api_key': None,
            'timeout': 30
        },
        'phone_validation': {
            'enabled': False,
            'provider': 'twilio',
            'api_key': None,
            'timeout': 10
        },
        'email_validation': {
            'enabled': False,
            'provider': 'sendgrid',
            'api_key': None,
            'timeout': 10
        }
    })
    
    @classmethod
    def from_env(cls) -> 'AppConfig':
        """Create app config from environment variables"""
        config = cls(
            app_name=os.getenv('APP_NAME', cls.app_name),
            app_version=os.getenv('APP_VERSION', cls.app_version),
            environment=Environment(os.getenv('ENVIRONMENT', cls.environment.value)),
            debug=os.getenv('DEBUG', 'false').lower() == 'true',
            host=os.getenv('HOST', cls.host),
            port=int(os.getenv('PORT', str(cls.port))),
            workers=int(os.getenv('WORKERS', str(cls.workers))),
            reload=os.getenv('RELOAD', 'false').lower() == 'true',
            demo_mode=os.getenv('DEMO_MODE', 'true').lower() == 'true',
            database=DatabaseConfig.from_env(),
            redis=RedisConfig.from_env(),
            security=SecurityConfig.from_env(),
            matching=MatchingConfig.from_env(),
            monitoring=MonitoringConfig.from_env()
        )
        
        # Load feature flags from environment
        for feature in config.features:
            env_key = f"FEATURE_{feature.upper()}"
            if os.getenv(env_key):
                config.features[feature] = os.getenv(env_key, 'true').lower() == 'true'
        
        return config
    
    @classmethod
    def from_file(cls, config_path: Union[str, Path]) -> 'AppConfig':
        """Load configuration from file (YAML or JSON)"""
        config_path = Path(config_path)
        
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            if config_path.suffix.lower() in ['.yml', '.yaml']:
                data = yaml.safe_load(f)
            elif config_path.suffix.lower() == '.json':
                data = json.load(f)
            else:
                raise ValueError(f"Unsupported config file format: {config_path.suffix}")
        
        # Create config from data
        return cls._from_dict(data)
    
    @classmethod
    def _from_dict(cls, data: Dict[str, Any]) -> 'AppConfig':
        """Create config from dictionary"""
        # Extract component configs
        database_data = data.pop('database', {})
        redis_data = data.pop('redis', {})
        security_data = data.pop('security', {})
        matching_data = data.pop('matching', {})
        monitoring_data = data.pop('monitoring', {})
        
        # Create component configs
        database_config = DatabaseConfig(**database_data)
        redis_config = RedisConfig(**redis_data)
        security_config = SecurityConfig(**security_data)
        matching_config = MatchingConfig(**matching_data)
        monitoring_config = MonitoringConfig(**monitoring_data)
        
        # Create main config
        return cls(
            database=database_config,
            redis=redis_config,
            security=security_config,
            matching=matching_config,
            monitoring=monitoring_config,
            **data
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary"""
        result = {}
        
        for field_def in fields(self):
            value = getattr(self, field_def.name)
            
            if hasattr(value, '__dict__'):  # Dataclass instance
                result[field_def.name] = {
                    f.name: getattr(value, f.name) 
                    for f in fields(value)
                }
            elif isinstance(value, Enum):
                result[field_def.name] = value.value
            else:
                result[field_def.name] = value
        
        return result
    
    def save_to_file(self, config_path: Union[str, Path]):
        """Save configuration to file"""
        config_path = Path(config_path)
        config_data = self.to_dict()
        
        with open(config_path, 'w', encoding='utf-8') as f:
            if config_path.suffix.lower() in ['.yml', '.yaml']:
                yaml.dump(config_data, f, default_flow_style=False, indent=2)
            elif config_path.suffix.lower() == '.json':
                json.dump(config_data, f, indent=2, default=str)
            else:
                raise ValueError(f"Unsupported config file format: {config_path.suffix}")
    
    def validate(self) -> List[str]:
        """Validate configuration and return list of errors"""
        errors = []
        
        # Validate database config
        if not self.database.host:
            errors.append("Database host cannot be empty")
        if self.database.port <= 0 or self.database.port > 65535:
            errors.append("Database port must be between 1 and 65535")
        
        # Validate Redis config
        if not self.redis.host:
            errors.append("Redis host cannot be empty")
        if self.redis.port <= 0 or self.redis.port > 65535:
            errors.append("Redis port must be between 1 and 65535")
        
        # Validate security config
        if len(self.security.jwt_secret_key) < 32:
            errors.append("JWT secret key must be at least 32 characters")
        if self.security.password_min_length < 8:
            errors.append("Password minimum length must be at least 8")
        
        # Validate matching config
        if not (0 < self.matching.default_confidence_threshold <= 1):
            errors.append("Default confidence threshold must be between 0 and 1")
        if not self.matching.enabled_algorithms:
            errors.append("At least one matching algorithm must be enabled")
        
        # Validate algorithm weights sum to 1
        weight_sum = (
            self.matching.deterministic_weight +
            self.matching.probabilistic_weight +
            self.matching.ai_hybrid_weight +
            self.matching.fuzzy_weight
        )
        if abs(weight_sum - 1.0) > 0.01:
            errors.append(f"Algorithm weights must sum to 1.0, got {weight_sum}")
        
        return errors
    
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment == Environment.PRODUCTION
    
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.environment == Environment.DEVELOPMENT

class ConfigManager:
    """Configuration manager with hot-reload and validation"""
    
    def __init__(self, config: Optional[AppConfig] = None):
        self.logger = logging.getLogger(__name__)
        self._config = config or AppConfig.from_env()
        self._config_file_path = None
        self._last_modified = None
        
        # Validate configuration on startup
        errors = self._config.validate()
        if errors:
            error_msg = f"Configuration validation failed:\n" + "\n".join(f"  - {e}" for e in errors)
            self.logger.error(error_msg)
            if self._config.is_production():
                raise ValueError(error_msg)
    
    @property
    def config(self) -> AppConfig:
        """Get current configuration"""
        return self._config
    
    def load_from_file(self, config_path: Union[str, Path]):
        """Load configuration from file"""
        config_path = Path(config_path)
        self._config_file_path = config_path
        self._config = AppConfig.from_file(config_path)
        self._last_modified = config_path.stat().st_mtime
        
        self.logger.info(f"Configuration loaded from {config_path}")
    
    def reload_if_changed(self) -> bool:
        """Reload configuration if file has changed"""
        if not self._config_file_path or not self._config_file_path.exists():
            return False
        
        current_modified = self._config_file_path.stat().st_mtime
        if current_modified > self._last_modified:
            try:
                old_config = self._config
                self._config = AppConfig.from_file(self._config_file_path)
                self._last_modified = current_modified
                
                self.logger.info("Configuration reloaded due to file change")
                return True
                
            except Exception as e:
                self.logger.error(f"Failed to reload configuration: {str(e)}")
                # Keep old configuration on error
                self._config = old_config
                
        return False
    
    def update_setting(self, key_path: str, value: Any):
        """Update a configuration setting dynamically"""
        keys = key_path.split('.')
        obj = self._config
        
        # Navigate to the parent object
        for key in keys[:-1]:
            if hasattr(obj, key):
                obj = getattr(obj, key)
            else:
                raise KeyError(f"Configuration key not found: {'.'.join(keys[:-1])}")
        
        # Set the final value
        final_key = keys[-1]
        if hasattr(obj, final_key):
            setattr(obj, final_key, value)
            self.logger.info(f"Configuration updated: {key_path} = {value}")
        else:
            raise KeyError(f"Configuration key not found: {key_path}")
    
    def get_setting(self, key_path: str, default: Any = None) -> Any:
        """Get a configuration setting by key path"""
        keys = key_path.split('.')
        obj = self._config
        
        try:
            for key in keys:
                if hasattr(obj, key):
                    obj = getattr(obj, key)
                else:
                    return default
            return obj
        except Exception:
            return default
    
    def export_config(self) -> Dict[str, Any]:
        """Export configuration as dictionary (with sensitive values masked)"""
        config_dict = self._config.to_dict()
        
        # Mask sensitive values
        sensitive_keys = ['password', 'secret', 'key', 'token', 'api_key']
        self._mask_sensitive_values(config_dict, sensitive_keys)
        
        return config_dict
    
    def _mask_sensitive_values(self, obj: Any, sensitive_keys: List[str]):
        """Recursively mask sensitive values in configuration"""
        if isinstance(obj, dict):
            for key, value in obj.items():
                if any(sensitive in key.lower() for sensitive in sensitive_keys):
                    if isinstance(value, str) and value:
                        obj[key] = "***masked***"
                else:
                    self._mask_sensitive_values(value, sensitive_keys)
        elif isinstance(obj, list):
            for item in obj:
                self._mask_sensitive_values(item, sensitive_keys)

# Global configuration instance
config_manager = ConfigManager()

# Convenience function to get current config
def get_config() -> AppConfig:
    """Get current application configuration"""
    return config_manager.config

# Example configuration file templates
DEVELOPMENT_CONFIG_TEMPLATE = """
app_name: "IDXR Development"
environment: "development"
debug: true
demo_mode: true

database:
  host: "localhost"
  port: 5432
  database: "idxr_dev"
  user: "dev_user"
  password: "dev_password"

redis:
  host: "localhost"
  port: 6379
  database: 0

matching:
  default_confidence_threshold: 0.8
  enable_ml_enhancement: false
  enabled_algorithms: ["deterministic", "probabilistic"]

monitoring:
  log_level: "DEBUG"
  prometheus_enabled: false
"""

PRODUCTION_CONFIG_TEMPLATE = """
app_name: "IDXR Production"
environment: "production"
debug: false
demo_mode: false

database:
  host: "${DB_HOST}"
  port: ${DB_PORT}
  database: "${DB_NAME}"
  user: "${DB_USER}"
  password: "${DB_PASSWORD}"
  pool_size: 50
  max_overflow: 100

redis:
  host: "${REDIS_HOST}"
  port: ${REDIS_PORT}
  password: "${REDIS_PASSWORD}"
  ssl: true

security:
  jwt_secret_key: "${JWT_SECRET_KEY}"
  cors_origins: ["https://yourdomain.com"]
  rate_limit_enabled: true

matching:
  default_confidence_threshold: 0.85
  enable_ml_enhancement: true
  enabled_algorithms: ["deterministic", "probabilistic", "ai_hybrid", "fuzzy"]

monitoring:
  log_level: "INFO"
  prometheus_enabled: true
  alert_webhook_url: "${ALERT_WEBHOOK_URL}"
"""