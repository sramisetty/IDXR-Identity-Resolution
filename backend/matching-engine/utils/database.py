"""
Enterprise Database Integration and Persistence Layer
Provides comprehensive database connectivity, ORM integration, and data management
"""

import asyncio
import asyncpg
import psycopg2
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json
import logging
from contextlib import asynccontextmanager
import os
from enum import Enum
import hashlib
import uuid

# SQLAlchemy imports for ORM functionality
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Float, Boolean, Text, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'idxr'),
    'user': os.getenv('DB_USER', 'idxr_user'),
    'password': os.getenv('DB_PASSWORD', 'idxr_password'),
    'pool_size': int(os.getenv('DB_POOL_SIZE', 20)),
    'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', 30)),
    'pool_timeout': int(os.getenv('DB_POOL_TIMEOUT', 30)),
    'pool_recycle': int(os.getenv('DB_POOL_RECYCLE', 3600))
}

# SQLAlchemy Base
Base = declarative_base()

class MatchStatus(Enum):
    PENDING = "pending"
    MATCHED = "matched"
    NO_MATCH = "no_match"
    MANUAL_REVIEW = "manual_review"
    ARCHIVED = "archived"

class DataQualityLevel(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"

# Database Models
class Identity(Base):
    __tablename__ = 'identities'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    identity_id = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(100), index=True)
    last_name = Column(String(100), index=True)
    middle_name = Column(String(100))
    dob = Column(DateTime, index=True)
    ssn_hash = Column(String(128), index=True)  # Hashed SSN for security
    driver_license = Column(String(50), index=True)
    phone = Column(String(20), index=True)
    email = Column(String(255), index=True)
    address_data = Column(JSON)  # Structured address information
    source_system = Column(String(100), nullable=False, index=True)
    data_quality_score = Column(Float, default=0.0, index=True)
    data_quality_level = Column(String(20), default=DataQualityLevel.FAIR.value)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True, index=True)
    metadata = Column(JSON)  # Additional metadata
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_identity_name_dob', 'first_name', 'last_name', 'dob'),
        Index('ix_identity_ssn_dob', 'ssn_hash', 'dob'),
        Index('ix_identity_source_created', 'source_system', 'created_at'),
        Index('ix_identity_quality_active', 'data_quality_level', 'is_active'),
    )

class MatchResult(Base):
    __tablename__ = 'match_results'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(String(100), nullable=False, index=True)
    source_identity_id = Column(UUID(as_uuid=True), index=True)
    matched_identity_id = Column(UUID(as_uuid=True), index=True)
    confidence_score = Column(Float, nullable=False, index=True)
    match_type = Column(String(50), nullable=False, index=True)
    algorithm_scores = Column(JSON)  # Individual algorithm scores
    matched_fields = Column(JSON)  # List of matched fields
    edge_cases = Column(JSON)  # Detected edge cases
    match_status = Column(String(20), default=MatchStatus.PENDING.value, index=True)
    processing_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    reviewed_by = Column(String(100))
    reviewed_at = Column(DateTime)
    review_notes = Column(Text)
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_match_confidence_created', 'confidence_score', 'created_at'),
        Index('ix_match_type_status', 'match_type', 'match_status'),
        Index('ix_match_transaction_created', 'transaction_id', 'created_at'),
    )

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(String(50), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    user_id = Column(String(100), index=True)
    session_id = Column(String(100), index=True)
    ip_address = Column(String(45))  # Supports IPv6
    user_agent = Column(Text)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(255))
    resource_id = Column(String(100), index=True)
    previous_values = Column(JSON)
    new_values = Column(JSON)
    success = Column(Boolean, default=True, index=True)
    error_message = Column(Text)
    processing_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    severity = Column(String(20), index=True)
    compliance_tags = Column(JSON)  # FISMA, NIST, etc.
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_audit_user_created', 'user_id', 'created_at'),
        Index('ix_audit_action_created', 'action', 'created_at'),
        Index('ix_audit_type_severity', 'event_type', 'severity'),
        Index('ix_audit_success_created', 'success', 'created_at'),
    )

class SystemMetrics(Base):
    __tablename__ = 'system_metrics'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, nullable=False, index=True)
    metric_type = Column(String(100), nullable=False, index=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String(20))
    tags = Column(JSON)  # Additional metadata tags
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Indexes for performance
    __table_args__ = (
        Index('ix_metrics_type_timestamp', 'metric_type', 'timestamp'),
        Index('ix_metrics_name_timestamp', 'metric_name', 'timestamp'),
    )

class Household(Base):
    __tablename__ = 'households'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    household_id = Column(String(100), unique=True, nullable=False, index=True)
    address_hash = Column(String(128), nullable=False, index=True)
    members = Column(JSON)  # List of identity IDs
    relationships = Column(JSON)  # Relationship mapping
    confidence_score = Column(Float, nullable=False, index=True)
    household_type = Column(String(50), index=True)  # family, roommates, etc.
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True, index=True)

class DatabaseConnection:
    """Enterprise database connection manager with connection pooling and async support"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._sync_engine = None
        self._async_engine = None
        self._sync_session_factory = None
        self._async_session_factory = None
        self._connection_pool = None
        self.is_connected = False
        
        # For demo purposes, simulate connection without actual database
        self.demo_mode = os.getenv('DEMO_MODE', 'true').lower() == 'true'
        
    def initialize_sync_engine(self):
        """Initialize synchronous SQLAlchemy engine"""
        if self.demo_mode:
            self.logger.info("Demo mode: Simulating sync database engine initialization")
            return True
            
        try:
            connection_string = (
                f"postgresql://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}"
                f"@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}"
            )
            
            self._sync_engine = create_engine(
                connection_string,
                pool_size=DATABASE_CONFIG['pool_size'],
                max_overflow=DATABASE_CONFIG['max_overflow'],
                pool_timeout=DATABASE_CONFIG['pool_timeout'],
                pool_recycle=DATABASE_CONFIG['pool_recycle'],
                echo=os.getenv('DB_ECHO', 'false').lower() == 'true'
            )
            
            self._sync_session_factory = sessionmaker(bind=self._sync_engine)
            self.logger.info("Synchronous database engine initialized")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize sync engine: {str(e)}")
            return False
    
    def initialize_async_engine(self):
        """Initialize asynchronous SQLAlchemy engine"""
        if self.demo_mode:
            self.logger.info("Demo mode: Simulating async database engine initialization")
            return True
            
        try:
            connection_string = (
                f"postgresql+asyncpg://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}"
                f"@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}"
            )
            
            self._async_engine = create_async_engine(
                connection_string,
                pool_size=DATABASE_CONFIG['pool_size'],
                max_overflow=DATABASE_CONFIG['max_overflow'],
                pool_timeout=DATABASE_CONFIG['pool_timeout'],
                pool_recycle=DATABASE_CONFIG['pool_recycle'],
                echo=os.getenv('DB_ECHO', 'false').lower() == 'true'
            )
            
            self._async_session_factory = async_sessionmaker(
                bind=self._async_engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            self.logger.info("Asynchronous database engine initialized")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize async engine: {str(e)}")
            return False
    
    async def initialize_connection_pool(self):
        """Initialize asyncpg connection pool for raw queries"""
        if self.demo_mode:
            self.logger.info("Demo mode: Simulating connection pool initialization")
            return True
            
        try:
            self._connection_pool = await asyncpg.create_pool(
                host=DATABASE_CONFIG['host'],
                port=DATABASE_CONFIG['port'],
                database=DATABASE_CONFIG['database'],
                user=DATABASE_CONFIG['user'],
                password=DATABASE_CONFIG['password'],
                min_size=5,
                max_size=DATABASE_CONFIG['pool_size'],
                command_timeout=60
            )
            
            self.logger.info("AsyncPG connection pool initialized")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize connection pool: {str(e)}")
            return False
    
    async def check_connection(self) -> bool:
        """Check database connectivity"""
        if self.demo_mode:
            # Simulate successful connection check
            await asyncio.sleep(0.01)
            self.is_connected = True
            return True
            
        try:
            if self._connection_pool:
                async with self._connection_pool.acquire() as conn:
                    result = await conn.fetchval('SELECT 1')
                    self.is_connected = result == 1
                    return self.is_connected
            
            # Fallback to sync connection check
            if self._sync_engine:
                with self._sync_engine.connect() as conn:
                    result = conn.execute("SELECT 1").scalar()
                    self.is_connected = result == 1
                    return self.is_connected
            
            return False
            
        except Exception as e:
            self.logger.error(f"Database connection check failed: {str(e)}")
            self.is_connected = False
            return False
    
    @asynccontextmanager
    async def get_async_session(self):
        """Get async database session with automatic cleanup"""
        if self.demo_mode:
            # Return a mock session for demo mode
            yield MockAsyncSession()
            return
            
        if not self._async_session_factory:
            self.initialize_async_engine()
        
        session = self._async_session_factory()
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            self.logger.error(f"Database session error: {str(e)}")
            raise
        finally:
            await session.close()
    
    def get_sync_session(self) -> Session:
        """Get synchronous database session"""
        if self.demo_mode:
            return MockSyncSession()
            
        if not self._sync_session_factory:
            self.initialize_sync_engine()
        
        return self._sync_session_factory()
    
    async def create_tables(self):
        """Create all database tables"""
        if self.demo_mode:
            self.logger.info("Demo mode: Simulating table creation")
            return True
            
        try:
            if not self._async_engine:
                self.initialize_async_engine()
            
            async with self._async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            self.logger.info("Database tables created successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to create tables: {str(e)}")
            return False

class MockAsyncSession:
    """Mock async session for demo mode"""
    
    async def commit(self):
        pass
    
    async def rollback(self):
        pass
    
    async def close(self):
        pass
    
    async def flush(self):
        pass
    
    def add(self, instance):
        pass
    
    async def execute(self, stmt):
        return MockResult([])

class MockSyncSession:
    """Mock sync session for demo mode"""
    
    def commit(self):
        pass
    
    def rollback(self):
        pass
    
    def close(self):
        pass
    
    def flush(self):
        pass
    
    def add(self, instance):
        pass
    
    def execute(self, stmt):
        return MockResult([])

class MockResult:
    """Mock query result for demo mode"""
    
    def __init__(self, data):
        self.data = data
    
    def scalar(self):
        return 1 if self.data else None
    
    def scalars(self):
        return self
    
    def all(self):
        return self.data
    
    def first(self):
        return self.data[0] if self.data else None

class IdentityRepository:
    """Repository pattern for Identity data access"""
    
    def __init__(self, db_connection: DatabaseConnection):
        self.db = db_connection
        self.logger = logging.getLogger(__name__)
    
    async def create_identity(self, identity_data: Dict[str, Any]) -> Optional[str]:
        """Create a new identity record"""
        try:
            if self.db.demo_mode:
                # Simulate identity creation
                identity_id = identity_data.get('identity_id', str(uuid.uuid4()))
                self.logger.info(f"Demo mode: Created identity {identity_id}")
                return identity_id
            
            async with self.db.get_async_session() as session:
                # Hash SSN for security
                ssn_hash = None
                if identity_data.get('ssn'):
                    ssn_hash = hashlib.sha256(identity_data['ssn'].encode()).hexdigest()
                
                identity = Identity(
                    identity_id=identity_data.get('identity_id', str(uuid.uuid4())),
                    first_name=identity_data.get('first_name'),
                    last_name=identity_data.get('last_name'),
                    middle_name=identity_data.get('middle_name'),
                    dob=identity_data.get('dob'),
                    ssn_hash=ssn_hash,
                    driver_license=identity_data.get('driver_license'),
                    phone=identity_data.get('phone'),
                    email=identity_data.get('email'),
                    address_data=identity_data.get('address', {}),
                    source_system=identity_data.get('source_system', 'UNKNOWN'),
                    data_quality_score=identity_data.get('data_quality_score', 0.0),
                    metadata=identity_data.get('metadata', {})
                )
                
                session.add(identity)
                await session.flush()
                
                self.logger.info(f"Created identity: {identity.identity_id}")
                return identity.identity_id
                
        except Exception as e:
            self.logger.error(f"Failed to create identity: {str(e)}")
            return None
    
    async def find_by_ssn_hash(self, ssn: str) -> List[Identity]:
        """Find identities by SSN hash"""
        try:
            if self.db.demo_mode:
                # Return mock data for demo
                return []
                
            ssn_hash = hashlib.sha256(ssn.encode()).hexdigest()
            
            async with self.db.get_async_session() as session:
                from sqlalchemy import select
                stmt = select(Identity).where(
                    Identity.ssn_hash == ssn_hash,
                    Identity.is_active == True
                )
                result = await session.execute(stmt)
                return result.scalars().all()
                
        except Exception as e:
            self.logger.error(f"Failed to find by SSN: {str(e)}")
            return []
    
    async def find_by_name_dob(self, first_name: str, last_name: str, dob: datetime) -> List[Identity]:
        """Find identities by name and date of birth"""
        try:
            if self.db.demo_mode:
                # Return mock data for demo
                return []
                
            async with self.db.get_async_session() as session:
                from sqlalchemy import select, func
                stmt = select(Identity).where(
                    func.lower(Identity.first_name) == first_name.lower(),
                    func.lower(Identity.last_name) == last_name.lower(),
                    Identity.dob == dob,
                    Identity.is_active == True
                )
                result = await session.execute(stmt)
                return result.scalars().all()
                
        except Exception as e:
            self.logger.error(f"Failed to find by name/DOB: {str(e)}")
            return []

class MatchResultRepository:
    """Repository for match results and analytics"""
    
    def __init__(self, db_connection: DatabaseConnection):
        self.db = db_connection
        self.logger = logging.getLogger(__name__)
    
    async def save_match_result(self, match_data: Dict[str, Any]) -> Optional[str]:
        """Save a match result"""
        try:
            if self.db.demo_mode:
                # Simulate saving match result
                result_id = str(uuid.uuid4())
                self.logger.info(f"Demo mode: Saved match result {result_id}")
                return result_id
            
            async with self.db.get_async_session() as session:
                match_result = MatchResult(
                    transaction_id=match_data['transaction_id'],
                    source_identity_id=match_data.get('source_identity_id'),
                    matched_identity_id=match_data.get('matched_identity_id'),
                    confidence_score=match_data['confidence_score'],
                    match_type=match_data['match_type'],
                    algorithm_scores=match_data.get('algorithm_scores', {}),
                    matched_fields=match_data.get('matched_fields', []),
                    edge_cases=match_data.get('edge_cases', []),
                    processing_time_ms=match_data.get('processing_time_ms', 0)
                )
                
                session.add(match_result)
                await session.flush()
                
                return str(match_result.id)
                
        except Exception as e:
            self.logger.error(f"Failed to save match result: {str(e)}")
            return None

class AuditLogRepository:
    """Repository for audit logging and compliance"""
    
    def __init__(self, db_connection: DatabaseConnection):
        self.db = db_connection
        self.logger = logging.getLogger(__name__)
    
    async def log_event(self, event_data: Dict[str, Any]) -> bool:
        """Log an audit event"""
        try:
            if self.db.demo_mode:
                # Simulate logging
                self.logger.info(f"Demo mode: Logged audit event {event_data.get('event_type')}")
                return True
            
            async with self.db.get_async_session() as session:
                audit_entry = AuditLog(
                    event_id=event_data.get('event_id', str(uuid.uuid4())),
                    event_type=event_data['event_type'],
                    user_id=event_data.get('user_id'),
                    action=event_data['action'],
                    success=event_data.get('success', True),
                    severity=event_data.get('severity', 'INFO')
                )
                
                session.add(audit_entry)
                await session.flush()
                return True
                
        except Exception as e:
            self.logger.error(f"Failed to log audit event: {str(e)}")
            return False

class MetricsRepository:
    """Repository for system metrics and monitoring"""
    
    def __init__(self, db_connection: DatabaseConnection):
        self.db = db_connection
        self.logger = logging.getLogger(__name__)
    
    async def record_metric(self, metric_type: str, metric_name: str, 
                          value: float, unit: str = None, tags: Dict[str, Any] = None) -> bool:
        """Record a system metric"""
        try:
            if self.db.demo_mode:
                # Simulate recording metric
                self.logger.info(f"Demo mode: Recorded metric {metric_name}={value}")
                return True
            
            async with self.db.get_async_session() as session:
                metric = SystemMetrics(
                    timestamp=datetime.utcnow(),
                    metric_type=metric_type,
                    metric_name=metric_name,
                    metric_value=value,
                    metric_unit=unit,
                    tags=tags or {}
                )
                
                session.add(metric)
                await session.flush()
                return True
                
        except Exception as e:
            self.logger.error(f"Failed to record metric: {str(e)}")
            return False