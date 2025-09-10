"""
Enterprise Security and Privacy Service
Implements comprehensive security, privacy, and compliance features for IDXR system
"""

import hashlib
import secrets
import bcrypt
import jwt
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import re
from typing import Dict, List, Optional, Any
import asyncio
import logging
from enum import Enum
import json
from dataclasses import dataclass, asdict

class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DataClassification(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

@dataclass
class SecurityEvent:
    event_id: str
    event_type: str
    user_id: str
    timestamp: datetime
    severity: SecurityLevel
    description: str
    ip_address: str
    user_agent: str
    additional_data: Dict[str, Any]

class SecurityService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.encryption_key = self._generate_or_load_key()
        self.cipher_suite = Fernet(self.encryption_key)
        self.jwt_secret = secrets.token_urlsafe(32)
        self.security_events = []
        self.failed_attempts = {}
        self.rate_limits = {}
        
    def _generate_or_load_key(self) -> bytes:
        """Generate or load encryption key"""
        try:
            with open('encryption.key', 'rb') as key_file:
                key = key_file.read()
        except FileNotFoundError:
            key = Fernet.generate_key()
            with open('encryption.key', 'wb') as key_file:
                key_file.write(key)
        return key
    
    def encrypt_pii(self, data: str, classification: DataClassification = DataClassification.CONFIDENTIAL) -> str:
        """Encrypt personally identifiable information"""
        try:
            if not data:
                return ""
            
            encrypted_data = self.cipher_suite.encrypt(data.encode())
            
            # Log encryption event for audit
            self._log_security_event(
                event_type="pii_encryption",
                description=f"PII encrypted with classification: {classification.value}",
                severity=SecurityLevel.MEDIUM
            )
            
            return base64.b64encode(encrypted_data).decode()
        except Exception as e:
            self.logger.error(f"Encryption failed: {str(e)}")
            raise
    
    def decrypt_pii(self, encrypted_data: str) -> str:
        """Decrypt personally identifiable information"""
        try:
            if not encrypted_data:
                return ""
            
            decoded_data = base64.b64decode(encrypted_data.encode())
            decrypted_data = self.cipher_suite.decrypt(decoded_data)
            
            # Log decryption event for audit
            self._log_security_event(
                event_type="pii_decryption",
                description="PII decrypted for authorized access",
                severity=SecurityLevel.MEDIUM
            )
            
            return decrypted_data.decode()
        except Exception as e:
            self.logger.error(f"Decryption failed: {str(e)}")
            raise
    
    def hash_identifier(self, identifier: str, salt: Optional[str] = None) -> str:
        """Create secure hash of identifier for matching without revealing PII"""
        if salt is None:
            salt = secrets.token_hex(16)
        
        # Use PBKDF2 for key stretching
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt.encode(),
            iterations=100000,
        )
        key = base64.b64encode(kdf.derive(identifier.encode())).decode()
        
        return f"{salt}${key}"
    
    def verify_hash(self, identifier: str, hashed: str) -> bool:
        """Verify identifier against hash"""
        try:
            salt, stored_key = hashed.split('$', 1)
            new_hash = self.hash_identifier(identifier, salt)
            return secrets.compare_digest(hashed, new_hash)
        except ValueError:
            return False
    
    def generate_jwt_token(self, user_id: str, permissions: List[str], expires_hours: int = 24) -> str:
        """Generate JWT token for authentication"""
        payload = {
            'user_id': user_id,
            'permissions': permissions,
            'exp': datetime.utcnow() + timedelta(hours=expires_hours),
            'iat': datetime.utcnow(),
            'jti': secrets.token_urlsafe(16)
        }
        
        token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')
        
        self._log_security_event(
            event_type="token_generated",
            user_id=user_id,
            description=f"JWT token generated with permissions: {permissions}",
            severity=SecurityLevel.LOW
        )
        
        return token
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            
            self._log_security_event(
                event_type="token_verified",
                user_id=payload.get('user_id', 'unknown'),
                description="JWT token successfully verified",
                severity=SecurityLevel.LOW
            )
            
            return payload
        except jwt.ExpiredSignatureError:
            self._log_security_event(
                event_type="token_expired",
                description="Expired JWT token used",
                severity=SecurityLevel.MEDIUM
            )
            return None
        except jwt.InvalidTokenError:
            self._log_security_event(
                event_type="token_invalid",
                description="Invalid JWT token used",
                severity=SecurityLevel.HIGH
            )
            return None
    
    def check_rate_limit(self, user_id: str, action: str, limit: int = 100, window_minutes: int = 60) -> bool:
        """Check if user has exceeded rate limit"""
        now = datetime.utcnow()
        key = f"{user_id}:{action}"
        
        if key not in self.rate_limits:
            self.rate_limits[key] = []
        
        # Remove old entries outside the window
        cutoff = now - timedelta(minutes=window_minutes)
        self.rate_limits[key] = [
            timestamp for timestamp in self.rate_limits[key] 
            if timestamp > cutoff
        ]
        
        # Check if limit exceeded
        if len(self.rate_limits[key]) >= limit:
            self._log_security_event(
                event_type="rate_limit_exceeded",
                user_id=user_id,
                description=f"Rate limit exceeded for action: {action}",
                severity=SecurityLevel.HIGH
            )
            return False
        
        # Add current timestamp
        self.rate_limits[key].append(now)
        return True
    
    def sanitize_input(self, input_data: str) -> str:
        """Sanitize input to prevent injection attacks"""
        if not input_data:
            return ""
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\';\\]', '', input_data)
        
        # Limit length
        if len(sanitized) > 1000:
            sanitized = sanitized[:1000]
            self._log_security_event(
                event_type="input_truncated",
                description="Input truncated due to length limit",
                severity=SecurityLevel.LOW
            )
        
        return sanitized.strip()
    
    def validate_data_access(self, user_id: str, data_classification: DataClassification, 
                           user_clearance: DataClassification) -> bool:
        """Validate if user has access to data based on classification"""
        classification_levels = {
            DataClassification.PUBLIC: 0,
            DataClassification.INTERNAL: 1,
            DataClassification.CONFIDENTIAL: 2,
            DataClassification.RESTRICTED: 3
        }
        
        user_level = classification_levels.get(user_clearance, 0)
        data_level = classification_levels.get(data_classification, 3)
        
        has_access = user_level >= data_level
        
        if not has_access:
            self._log_security_event(
                event_type="access_denied",
                user_id=user_id,
                description=f"Access denied to {data_classification.value} data with {user_clearance.value} clearance",
                severity=SecurityLevel.HIGH
            )
        
        return has_access
    
    def track_failed_login(self, user_id: str, ip_address: str) -> bool:
        """Track failed login attempts and detect potential attacks"""
        now = datetime.utcnow()
        
        if user_id not in self.failed_attempts:
            self.failed_attempts[user_id] = []
        
        # Remove attempts older than 1 hour
        cutoff = now - timedelta(hours=1)
        self.failed_attempts[user_id] = [
            attempt for attempt in self.failed_attempts[user_id]
            if attempt['timestamp'] > cutoff
        ]
        
        # Add current attempt
        self.failed_attempts[user_id].append({
            'timestamp': now,
            'ip_address': ip_address
        })
        
        # Check if account should be locked
        if len(self.failed_attempts[user_id]) >= 5:
            self._log_security_event(
                event_type="account_locked",
                user_id=user_id,
                description=f"Account locked due to {len(self.failed_attempts[user_id])} failed attempts",
                severity=SecurityLevel.CRITICAL,
                additional_data={'ip_address': ip_address}
            )
            return True  # Account locked
        
        self._log_security_event(
            event_type="failed_login",
            user_id=user_id,
            description=f"Failed login attempt #{len(self.failed_attempts[user_id])}",
            severity=SecurityLevel.MEDIUM,
            additional_data={'ip_address': ip_address}
        )
        
        return False  # Account not locked
    
    def generate_audit_log(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Generate comprehensive audit log for compliance"""
        filtered_events = [
            event for event in self.security_events
            if start_date <= event.timestamp <= end_date
        ]
        
        return [asdict(event) for event in filtered_events]
    
    def _log_security_event(self, event_type: str, description: str, 
                           severity: SecurityLevel, user_id: str = "system",
                           ip_address: str = "127.0.0.1", user_agent: str = "IDXR-System",
                           additional_data: Optional[Dict[str, Any]] = None):
        """Log security event for audit trail"""
        event = SecurityEvent(
            event_id=secrets.token_urlsafe(16),
            event_type=event_type,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            severity=severity,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            additional_data=additional_data or {}
        )
        
        self.security_events.append(event)
        
        # Log to file for persistence
        self.logger.info(f"Security Event: {event_type} - {description}")
        
        # Alert on critical events
        if severity == SecurityLevel.CRITICAL:
            self._send_security_alert(event)
    
    def _send_security_alert(self, event: SecurityEvent):
        """Send alert for critical security events"""
        # In production, this would integrate with alerting systems
        self.logger.critical(f"SECURITY ALERT: {event.description} - Event ID: {event.event_id}")

class PrivacyService:
    def __init__(self):
        self.data_retention_policies = {
            'identity_records': timedelta(days=2555),  # 7 years
            'audit_logs': timedelta(days=2555),
            'session_data': timedelta(hours=24),
            'temp_data': timedelta(hours=1)
        }
        self.anonymization_rules = {}
        self.consent_records = {}
    
    def apply_data_minimization(self, data: Dict[str, Any], purpose: str) -> Dict[str, Any]:
        """Apply data minimization principles based on purpose"""
        purpose_fields = {
            'matching': ['ssn', 'first_name', 'last_name', 'dob', 'address'],
            'reporting': ['age_group', 'state', 'match_confidence'],
            'audit': ['user_id', 'timestamp', 'action']
        }
        
        allowed_fields = purpose_fields.get(purpose, [])
        minimized_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        return minimized_data
    
    def anonymize_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize data for privacy protection"""
        anonymized = data.copy()
        
        # Replace direct identifiers with anonymized versions
        if 'ssn' in anonymized:
            anonymized['ssn'] = f"***-**-{anonymized['ssn'][-4:]}"
        
        if 'first_name' in anonymized:
            anonymized['first_name'] = anonymized['first_name'][0] + "*" * (len(anonymized['first_name']) - 1)
        
        if 'address' in anonymized:
            parts = anonymized['address'].split()
            if len(parts) > 2:
                anonymized['address'] = f"*** {parts[-2]} {parts[-1]}"
        
        # Add anonymization timestamp
        anonymized['anonymized_at'] = datetime.utcnow().isoformat()
        
        return anonymized
    
    def check_data_retention(self, data_type: str, created_date: datetime) -> bool:
        """Check if data should be retained based on retention policy"""
        if data_type not in self.data_retention_policies:
            return True  # Keep if no policy defined
        
        retention_period = self.data_retention_policies[data_type]
        expiry_date = created_date + retention_period
        
        return datetime.utcnow() < expiry_date
    
    def record_consent(self, user_id: str, data_types: List[str], purposes: List[str]):
        """Record user consent for data processing"""
        consent_id = secrets.token_urlsafe(16)
        self.consent_records[consent_id] = {
            'user_id': user_id,
            'data_types': data_types,
            'purposes': purposes,
            'timestamp': datetime.utcnow(),
            'status': 'active'
        }
        return consent_id
    
    def verify_consent(self, user_id: str, data_type: str, purpose: str) -> bool:
        """Verify user has given consent for specific data use"""
        for consent in self.consent_records.values():
            if (consent['user_id'] == user_id and 
                consent['status'] == 'active' and
                data_type in consent['data_types'] and
                purpose in consent['purposes']):
                return True
        return False

class ComplianceService:
    def __init__(self):
        self.compliance_frameworks = {
            'FISMA': self._fisma_requirements(),
            'NIST': self._nist_requirements(),
            'COLORADO_PRIVACY': self._colorado_privacy_requirements()
        }
        self.compliance_status = {}
    
    def _fisma_requirements(self) -> Dict[str, Any]:
        """FISMA compliance requirements"""
        return {
            'access_control': True,
            'audit_logging': True,
            'encryption_at_rest': True,
            'encryption_in_transit': True,
            'incident_response': True,
            'risk_assessment': True
        }
    
    def _nist_requirements(self) -> Dict[str, Any]:
        """NIST cybersecurity framework requirements"""
        return {
            'identify': ['asset_management', 'risk_assessment'],
            'protect': ['access_control', 'data_security', 'training'],
            'detect': ['monitoring', 'detection_processes'],
            'respond': ['incident_response', 'communications'],
            'recover': ['recovery_planning', 'improvements']
        }
    
    def _colorado_privacy_requirements(self) -> Dict[str, Any]:
        """Colorado Privacy Act requirements"""
        return {
            'data_minimization': True,
            'purpose_limitation': True,
            'consent_management': True,
            'data_subject_rights': True,
            'privacy_by_design': True
        }
    
    def assess_compliance(self, framework: str) -> Dict[str, Any]:
        """Assess compliance with specific framework"""
        if framework not in self.compliance_frameworks:
            return {'status': 'unknown', 'score': 0}
        
        requirements = self.compliance_frameworks[framework]
        
        # Simulate compliance assessment
        compliance_score = 0.95  # 95% compliant
        
        assessment = {
            'framework': framework,
            'score': compliance_score,
            'status': 'compliant' if compliance_score >= 0.9 else 'non_compliant',
            'requirements': requirements,
            'assessment_date': datetime.utcnow(),
            'recommendations': self._generate_recommendations(framework, compliance_score)
        }
        
        self.compliance_status[framework] = assessment
        return assessment
    
    def _generate_recommendations(self, framework: str, score: float) -> List[str]:
        """Generate compliance recommendations"""
        recommendations = []
        
        if score < 1.0:
            if framework == 'FISMA':
                recommendations.extend([
                    "Enhance multi-factor authentication",
                    "Implement automated security monitoring",
                    "Regular penetration testing"
                ])
            elif framework == 'NIST':
                recommendations.extend([
                    "Improve incident response procedures",
                    "Enhanced employee security training",
                    "Regular risk assessments"
                ])
            elif framework == 'COLORADO_PRIVACY':
                recommendations.extend([
                    "Implement enhanced consent mechanisms",
                    "Data retention policy review",
                    "Privacy impact assessments"
                ])
        
        return recommendations
    
    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        return {
            'report_date': datetime.utcnow(),
            'frameworks_assessed': list(self.compliance_status.keys()),
            'overall_status': self._calculate_overall_status(),
            'framework_details': self.compliance_status,
            'action_items': self._generate_action_items()
        }
    
    def _calculate_overall_status(self) -> Dict[str, Any]:
        """Calculate overall compliance status"""
        if not self.compliance_status:
            return {'status': 'not_assessed', 'score': 0}
        
        scores = [status['score'] for status in self.compliance_status.values()]
        avg_score = sum(scores) / len(scores)
        
        return {
            'status': 'compliant' if avg_score >= 0.9 else 'needs_improvement',
            'score': avg_score,
            'compliant_frameworks': len([s for s in scores if s >= 0.9]),
            'total_frameworks': len(scores)
        }
    
    def _generate_action_items(self) -> List[Dict[str, Any]]:
        """Generate action items for compliance improvement"""
        action_items = []
        
        for framework, status in self.compliance_status.items():
            if status['score'] < 1.0:
                for recommendation in status['recommendations']:
                    action_items.append({
                        'framework': framework,
                        'priority': 'high' if status['score'] < 0.8 else 'medium',
                        'action': recommendation,
                        'due_date': (datetime.utcnow() + timedelta(days=30)).isoformat()
                    })
        
        return action_items