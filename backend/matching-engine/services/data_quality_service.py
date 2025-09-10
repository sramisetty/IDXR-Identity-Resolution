"""
Comprehensive Data Quality and Validation Service for IDXR
Advanced data validation, quality assessment, and cleansing for Colorado OIT requirements
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Set, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime, date, timedelta
from enum import Enum
import asyncio
import json
import hashlib
from collections import defaultdict, Counter
import pandas as pd
import numpy as np
from difflib import SequenceMatcher
import usaddress
import phonenumbers
from phonenumbers.phonenumberutil import NumberParseException
import requests

logger = logging.getLogger(__name__)

class ValidationLevel(Enum):
    BASIC = "basic"
    STANDARD = "standard"
    ENHANCED = "enhanced"
    COMPREHENSIVE = "comprehensive"

class DataIssueType(Enum):
    MISSING_REQUIRED = "missing_required"
    INVALID_FORMAT = "invalid_format"
    OUT_OF_RANGE = "out_of_range"
    INCONSISTENT = "inconsistent"
    DUPLICATE = "duplicate"
    OUTDATED = "outdated"
    SUSPICIOUS = "suspicious"
    INCOMPLETE = "incomplete"

class DataQuality(Enum):
    EXCELLENT = "excellent"  # 95-100%
    GOOD = "good"           # 85-94%
    FAIR = "fair"           # 70-84%
    POOR = "poor"           # Below 70%

@dataclass
class ValidationResult:
    field_name: str
    is_valid: bool
    quality_score: float  # 0-100
    issues: List[str]
    suggestions: List[str]
    cleaned_value: Optional[Any] = None
    confidence: float = 1.0

@dataclass
class DataQualityReport:
    record_id: str
    overall_score: float
    quality_level: DataQuality
    field_results: List[ValidationResult]
    critical_issues: List[str]
    warnings: List[str]
    recommendations: List[str]
    processing_time_ms: int
    validation_level: ValidationLevel

class AddressValidator:
    """Advanced address validation and standardization"""
    
    def __init__(self):
        self.address_patterns = self._load_address_patterns()
        self.state_codes = self._load_state_codes()
        self.colorado_cities = self._load_colorado_cities()
    
    def _load_address_patterns(self) -> Dict:
        """Load address validation patterns"""
        return {
            'street_number': r'^\d+[a-zA-Z]?(\s*-\s*\d+[a-zA-Z]?)?$',
            'street_name': r'^[a-zA-Z0-9\s\-\'\.]+$',
            'apartment': r'^(apt|apartment|unit|suite|ste|#)\s*[a-zA-Z0-9\-]+$',
            'zip_code': r'^\d{5}(-\d{4})?$',
            'po_box': r'^(po|p\.o\.)\s*box\s*\d+$'
        }
    
    def _load_state_codes(self) -> Set[str]:
        """Load valid state codes"""
        return {
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
            'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
            'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
        }
    
    def _load_colorado_cities(self) -> Set[str]:
        """Load Colorado cities for validation"""
        return {
            'denver', 'colorado springs', 'aurora', 'fort collins', 'lakewood',
            'thornton', 'arvada', 'westminster', 'pueblo', 'boulder',
            'centennial', 'greeley', 'longmont', 'loveland', 'grand junction',
            'broomfield', 'wheat ridge', 'northglenn', 'littleton', 'englewood'
        }
    
    async def validate_address(self, address: Dict) -> ValidationResult:
        """Validate and standardize address"""
        issues = []
        suggestions = []
        quality_score = 100.0
        cleaned_address = address.copy()
        
        # Check required fields
        required_fields = ['street', 'city', 'state', 'zip']
        for field in required_fields:
            if not address.get(field):
                issues.append(f"Missing {field}")
                quality_score -= 15
        
        # Validate street address
        if address.get('street'):
            street_result = await self._validate_street_address(address['street'])
            if not street_result['valid']:
                issues.extend(street_result['issues'])
                quality_score -= 10
            else:
                cleaned_address['street'] = street_result['cleaned']
        
        # Validate city
        if address.get('city'):
            city = address['city'].lower().strip()
            if city not in self.colorado_cities:
                issues.append("City not recognized in Colorado")
                quality_score -= 5
                suggestions.append(f"Verify city name: {address['city']}")
        
        # Validate state
        if address.get('state'):
            state = address['state'].upper().strip()
            if state not in self.state_codes:
                issues.append("Invalid state code")
                quality_score -= 10
            elif state != 'CO':
                issues.append("Address outside Colorado")
                suggestions.append("Verify if this is the correct address")
            cleaned_address['state'] = state
        
        # Validate ZIP code
        if address.get('zip'):
            zip_result = await self._validate_zip_code(address['zip'])
            if not zip_result['valid']:
                issues.extend(zip_result['issues'])
                quality_score -= 10
            else:
                cleaned_address['zip'] = zip_result['cleaned']
        
        # Address completeness check
        if all(address.get(field) for field in required_fields):
            # Attempt USPS-style parsing
            try:
                full_address = f"{address['street']}, {address['city']}, {address['state']} {address['zip']}"
                parsed = usaddress.parse(full_address)
                # Additional validation based on parsed components
                suggestions.append("Address format appears valid")
            except:
                issues.append("Address format may be incorrect")
                quality_score -= 5
        
        return ValidationResult(
            field_name="address",
            is_valid=len(issues) == 0,
            quality_score=max(quality_score, 0),
            issues=issues,
            suggestions=suggestions,
            cleaned_value=cleaned_address if issues else None
        )
    
    async def _validate_street_address(self, street: str) -> Dict:
        """Validate street address format"""
        street = street.strip()
        
        # Check for basic patterns
        if not re.match(r'^\d+', street):
            return {
                'valid': False,
                'issues': ["Street address should start with a number"],
                'cleaned': street
            }
        
        # Check for invalid characters
        if re.search(r'[^\w\s\-\.\#\&]', street):
            return {
                'valid': False,
                'issues': ["Street address contains invalid characters"],
                'cleaned': re.sub(r'[^\w\s\-\.\#\&]', '', street)
            }
        
        # Standardize abbreviations
        standardized = self._standardize_street_abbreviations(street)
        
        return {
            'valid': True,
            'issues': [],
            'cleaned': standardized
        }
    
    def _standardize_street_abbreviations(self, street: str) -> str:
        """Standardize street type abbreviations"""
        abbreviations = {
            'street': 'St', 'avenue': 'Ave', 'boulevard': 'Blvd',
            'drive': 'Dr', 'lane': 'Ln', 'road': 'Rd', 'circle': 'Cir',
            'court': 'Ct', 'place': 'Pl', 'way': 'Way', 'trail': 'Trl'
        }
        
        for full, abbrev in abbreviations.items():
            # Case insensitive replacement
            pattern = rf'\b{re.escape(full)}\b'
            street = re.sub(pattern, abbrev, street, flags=re.IGNORECASE)
        
        return street.title()
    
    async def _validate_zip_code(self, zip_code: str) -> Dict:
        """Validate ZIP code format and range"""
        zip_code = zip_code.strip()
        
        # Check basic format
        if not re.match(r'^\d{5}(-\d{4})?$', zip_code):
            return {
                'valid': False,
                'issues': ["Invalid ZIP code format"],
                'cleaned': re.sub(r'[^\d\-]', '', zip_code)
            }
        
        # Extract 5-digit ZIP
        base_zip = zip_code[:5]
        
        # Colorado ZIP code ranges (approximate)
        colorado_zip_ranges = [(80000, 81999)]  # Primary Colorado range
        
        zip_int = int(base_zip)
        in_colorado = any(start <= zip_int <= end for start, end in colorado_zip_ranges)
        
        if not in_colorado:
            return {
                'valid': False,
                'issues': ["ZIP code not in Colorado range"],
                'cleaned': zip_code
            }
        
        return {
            'valid': True,
            'issues': [],
            'cleaned': zip_code
        }

class PhoneValidator:
    """Phone number validation and standardization"""
    
    def __init__(self):
        self.colorado_area_codes = {'303', '720', '970'}
    
    async def validate_phone(self, phone: str) -> ValidationResult:
        """Validate and standardize phone number"""
        issues = []
        suggestions = []
        quality_score = 100.0
        cleaned_phone = None
        
        if not phone:
            return ValidationResult(
                field_name="phone",
                is_valid=False,
                quality_score=0,
                issues=["Phone number is required"],
                suggestions=["Provide a valid phone number"]
            )
        
        try:
            # Parse phone number
            parsed_phone = phonenumbers.parse(phone, "US")
            
            # Validate number
            if not phonenumbers.is_valid_number(parsed_phone):
                issues.append("Invalid phone number format")
                quality_score -= 30
            
            # Format phone number
            cleaned_phone = phonenumbers.format_number(parsed_phone, phonenumbers.PhoneNumberFormat.NATIONAL)
            
            # Check if it's a Colorado area code
            area_code = str(parsed_phone.national_number)[:3]
            if area_code not in self.colorado_area_codes:
                suggestions.append("Phone number area code is outside Colorado")
                quality_score -= 5
            
            # Check for mobile vs landline
            number_type = phonenumbers.number_type(parsed_phone)
            if number_type == phonenumbers.PhoneNumberType.MOBILE:
                suggestions.append("Mobile phone number detected")
            elif number_type == phonenumbers.PhoneNumberType.FIXED_LINE:
                suggestions.append("Landline phone number detected")
            
        except NumberParseException as e:
            issues.append(f"Phone parsing error: {str(e)}")
            quality_score -= 40
            
            # Try basic cleanup
            digits_only = re.sub(r'[^\d]', '', phone)
            if len(digits_only) == 10:
                cleaned_phone = f"({digits_only[:3]}) {digits_only[3:6]}-{digits_only[6:]}"
                suggestions.append("Attempted basic phone number formatting")
            elif len(digits_only) == 11 and digits_only.startswith('1'):
                cleaned_phone = f"({digits_only[1:4]}) {digits_only[4:7]}-{digits_only[7:]}"
                suggestions.append("Removed country code and formatted")
        
        return ValidationResult(
            field_name="phone",
            is_valid=len(issues) == 0,
            quality_score=max(quality_score, 0),
            issues=issues,
            suggestions=suggestions,
            cleaned_value=cleaned_phone
        )

class NameValidator:
    """Name validation and standardization"""
    
    def __init__(self):
        self.common_prefixes = {'mr', 'mrs', 'ms', 'dr', 'prof', 'rev'}
        self.common_suffixes = {'jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md'}
        self.suspicious_patterns = [r'\d', r'[^a-zA-Z\s\'\-\.]']
    
    async def validate_name(self, name: str, field_name: str) -> ValidationResult:
        """Validate and standardize name field"""
        issues = []
        suggestions = []
        quality_score = 100.0
        cleaned_name = None
        
        if not name or not name.strip():
            return ValidationResult(
                field_name=field_name,
                is_valid=False,
                quality_score=0,
                issues=[f"{field_name} is required"],
                suggestions=[f"Provide a valid {field_name}"]
            )
        
        original_name = name.strip()
        working_name = original_name.lower()
        
        # Check for suspicious patterns
        for pattern in self.suspicious_patterns:
            if re.search(pattern, working_name):
                issues.append(f"{field_name} contains invalid characters")
                quality_score -= 20
        
        # Check length
        if len(original_name) < 2:
            issues.append(f"{field_name} is too short")
            quality_score -= 15
        elif len(original_name) > 50:
            issues.append(f"{field_name} is unusually long")
            quality_score -= 5
        
        # Check for multiple names in single field
        if field_name in ['first_name', 'last_name'] and len(original_name.split()) > 2:
            suggestions.append(f"Multiple names detected in {field_name}")
            quality_score -= 5
        
        # Standardize capitalization
        cleaned_name = self._standardize_name_case(original_name)
        
        # Check for common prefixes/suffixes in wrong fields
        if field_name == 'first_name':
            if working_name in self.common_prefixes:
                suggestions.append("First name appears to be a title/prefix")
                quality_score -= 10
        
        return ValidationResult(
            field_name=field_name,
            is_valid=len(issues) == 0,
            quality_score=max(quality_score, 0),
            issues=issues,
            suggestions=suggestions,
            cleaned_value=cleaned_name if cleaned_name != original_name else None
        )
    
    def _standardize_name_case(self, name: str) -> str:
        """Standardize name capitalization"""
        # Handle special cases like O'Connor, McDonald, etc.
        name = name.title()
        
        # Fix common patterns
        name = re.sub(r"([Mm]c)([a-z])", lambda m: m.group(1) + m.group(2).upper(), name)
        name = re.sub(r"([Oo]')([a-z])", lambda m: m.group(1) + m.group(2).upper(), name)
        name = re.sub(r"\b([A-Z])([a-z]+)-([A-Z])([a-z]+)\b", r"\1\2-\3\4", name)
        
        return name

class SSNValidator:
    """Social Security Number validation"""
    
    def __init__(self):
        self.invalid_ssn_patterns = [
            r'^000',      # Area number 000
            r'^666',      # Area number 666
            r'^9\d{2}',   # Area numbers 900-999
            r'^\d{3}00',  # Group number 00
            r'^\d{5}0000' # Serial number 0000
        ]
    
    async def validate_ssn(self, ssn: str, partial_ok: bool = True) -> ValidationResult:
        """Validate SSN or SSN last 4"""
        issues = []
        suggestions = []
        quality_score = 100.0
        cleaned_ssn = None
        
        if not ssn:
            return ValidationResult(
                field_name="ssn",
                is_valid=partial_ok,  # Partial OK if last 4 is acceptable
                quality_score=0 if not partial_ok else 60,
                issues=[] if partial_ok else ["SSN is required"],
                suggestions=["SSN helps improve match accuracy"] if partial_ok else []
            )
        
        # Clean SSN - remove all non-digits
        digits_only = re.sub(r'[^\d]', '', ssn)
        
        if len(digits_only) == 4:
            # Last 4 digits
            if partial_ok:
                cleaned_ssn = digits_only
                quality_score = 80  # Partial SSN is still useful
                suggestions.append("Partial SSN (last 4 digits) provided")
            else:
                issues.append("Only partial SSN provided")
                quality_score = 40
        
        elif len(digits_only) == 9:
            # Full SSN
            full_ssn = digits_only
            
            # Check against invalid patterns
            for pattern in self.invalid_ssn_patterns:
                if re.match(pattern, full_ssn):
                    issues.append("SSN matches invalid number pattern")
                    quality_score -= 30
                    break
            
            # Format SSN
            cleaned_ssn = f"{full_ssn[:3]}-{full_ssn[3:5]}-{full_ssn[5:]}"
            
        else:
            issues.append("Invalid SSN length")
            quality_score -= 40
        
        return ValidationResult(
            field_name="ssn",
            is_valid=len(issues) == 0,
            quality_score=max(quality_score, 0),
            issues=issues,
            suggestions=suggestions,
            cleaned_value=cleaned_ssn
        )

class DateValidator:
    """Date validation and standardization"""
    
    def __init__(self):
        self.date_formats = [
            '%Y-%m-%d',    # 2023-12-25
            '%m/%d/%Y',    # 12/25/2023
            '%m-%d-%Y',    # 12-25-2023
            '%Y/%m/%d',    # 2023/12/25
            '%B %d, %Y',   # December 25, 2023
            '%b %d, %Y',   # Dec 25, 2023
            '%d/%m/%Y',    # 25/12/2023 (European)
        ]
    
    async def validate_date(self, date_str: str, field_name: str = "date") -> ValidationResult:
        """Validate and standardize date"""
        issues = []
        suggestions = []
        quality_score = 100.0
        cleaned_date = None
        
        if not date_str:
            return ValidationResult(
                field_name=field_name,
                is_valid=False,
                quality_score=0,
                issues=[f"{field_name} is required"],
                suggestions=[f"Provide a valid {field_name}"]
            )
        
        date_str = date_str.strip()
        parsed_date = None
        
        # Try parsing with different formats
        for date_format in self.date_formats:
            try:
                parsed_date = datetime.strptime(date_str, date_format).date()
                break
            except ValueError:
                continue
        
        if not parsed_date:
            issues.append("Unable to parse date format")
            quality_score -= 40
        else:
            # Validate date range
            today = date.today()
            
            if field_name == 'dob':  # Date of birth validations
                if parsed_date > today:
                    issues.append("Date of birth cannot be in the future")
                    quality_score -= 30
                
                age = today.year - parsed_date.year
                if age > 120:
                    issues.append("Date of birth indicates unrealistic age")
                    quality_score -= 20
                elif age < 0:
                    issues.append("Invalid date of birth")
                    quality_score -= 30
                
                # Standardize format
                cleaned_date = parsed_date.strftime('%Y-%m-%d')
            
            else:  # General date validation
                # Check if date is reasonable (not too far in past/future)
                years_diff = abs((today - parsed_date).days / 365.25)
                if years_diff > 100:
                    suggestions.append("Date is very old, please verify")
                    quality_score -= 5
                
                cleaned_date = parsed_date.strftime('%Y-%m-%d')
        
        return ValidationResult(
            field_name=field_name,
            is_valid=len(issues) == 0,
            quality_score=max(quality_score, 0),
            issues=issues,
            suggestions=suggestions,
            cleaned_value=cleaned_date
        )

class EmailValidator:
    """Email validation and standardization"""
    
    def __init__(self):
        self.email_pattern = re.compile(
            r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        )
        self.disposable_domains = {
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'yopmail.com'
        }
    
    async def validate_email(self, email: str) -> ValidationResult:
        """Validate and standardize email address"""
        issues = []
        suggestions = []
        quality_score = 100.0
        cleaned_email = None
        
        if not email:
            return ValidationResult(
                field_name="email",
                is_valid=False,
                quality_score=0,
                issues=["Email address is required"],
                suggestions=["Provide a valid email address"]
            )
        
        email = email.strip().lower()
        
        # Basic format validation
        if not self.email_pattern.match(email):
            issues.append("Invalid email format")
            quality_score -= 40
        else:
            cleaned_email = email
            
            # Extract domain
            domain = email.split('@')[1] if '@' in email else ''
            
            # Check for disposable email
            if domain in self.disposable_domains:
                issues.append("Disposable email address detected")
                quality_score -= 20
                suggestions.append("Consider requesting a permanent email address")
            
            # Check for common typos in popular domains
            typo_corrections = {
                'gmail.co': 'gmail.com',
                'gmail.com': 'gmail.com',
                'yahoo.co': 'yahoo.com',
                'hotmail.co': 'hotmail.com'
            }
            
            for typo, correct in typo_corrections.items():
                if domain == typo and typo != correct:
                    suggestions.append(f"Did you mean {email.replace(typo, correct)}?")
                    quality_score -= 5
        
        return ValidationResult(
            field_name="email",
            is_valid=len(issues) == 0,
            quality_score=max(quality_score, 0),
            issues=issues,
            suggestions=suggestions,
            cleaned_value=cleaned_email
        )

class DataQualityService:
    """Main data quality assessment and improvement service"""
    
    def __init__(self):
        self.address_validator = AddressValidator()
        self.phone_validator = PhoneValidator()
        self.name_validator = NameValidator()
        self.ssn_validator = SSNValidator()
        self.date_validator = DateValidator()
        self.email_validator = EmailValidator()
        
        # Field importance weights
        self.field_weights = {
            'first_name': 0.15,
            'last_name': 0.15,
            'dob': 0.20,
            'ssn': 0.25,
            'address': 0.15,
            'phone': 0.05,
            'email': 0.05
        }
    
    async def assess_data_quality(self, demographic_data: Dict, 
                                 validation_level: ValidationLevel = ValidationLevel.STANDARD) -> DataQualityReport:
        """Comprehensive data quality assessment"""
        start_time = datetime.now()
        
        field_results = []
        critical_issues = []
        warnings = []
        recommendations = []
        
        # Validate each field
        if 'first_name' in demographic_data:
            result = await self.name_validator.validate_name(
                demographic_data['first_name'], 'first_name'
            )
            field_results.append(result)
            if not result.is_valid:
                critical_issues.extend(result.issues)
        
        if 'last_name' in demographic_data:
            result = await self.name_validator.validate_name(
                demographic_data['last_name'], 'last_name'
            )
            field_results.append(result)
            if not result.is_valid:
                critical_issues.extend(result.issues)
        
        if 'dob' in demographic_data:
            result = await self.date_validator.validate_date(
                demographic_data['dob'], 'dob'
            )
            field_results.append(result)
            if not result.is_valid:
                critical_issues.extend(result.issues)
        
        if 'ssn' in demographic_data:
            result = await self.ssn_validator.validate_ssn(demographic_data['ssn'])
            field_results.append(result)
            if result.quality_score < 70:
                warnings.extend(result.suggestions)
        
        if 'address' in demographic_data and isinstance(demographic_data['address'], dict):
            result = await self.address_validator.validate_address(demographic_data['address'])
            field_results.append(result)
            if not result.is_valid:
                warnings.extend(result.issues)
        
        if 'phone' in demographic_data:
            result = await self.phone_validator.validate_phone(demographic_data['phone'])
            field_results.append(result)
            if not result.is_valid:
                warnings.extend(result.issues)
        
        if 'email' in demographic_data:
            result = await self.email_validator.validate_email(demographic_data['email'])
            field_results.append(result)
            if not result.is_valid:
                warnings.extend(result.issues)
        
        # Calculate overall quality score
        weighted_score = 0
        total_weight = 0
        
        for result in field_results:
            weight = self.field_weights.get(result.field_name, 0.05)
            weighted_score += result.quality_score * weight
            total_weight += weight
        
        overall_score = weighted_score / total_weight if total_weight > 0 else 0
        
        # Determine quality level
        if overall_score >= 95:
            quality_level = DataQuality.EXCELLENT
        elif overall_score >= 85:
            quality_level = DataQuality.GOOD
        elif overall_score >= 70:
            quality_level = DataQuality.FAIR
        else:
            quality_level = DataQuality.POOR
        
        # Generate recommendations
        if overall_score < 85:
            recommendations.append("Consider data cleansing to improve match accuracy")
        
        if len(critical_issues) > 0:
            recommendations.append("Resolve critical data issues before processing")
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return DataQualityReport(
            record_id=demographic_data.get('record_id', 'unknown'),
            overall_score=overall_score,
            quality_level=quality_level,
            field_results=field_results,
            critical_issues=critical_issues,
            warnings=warnings,
            recommendations=recommendations,
            processing_time_ms=int(processing_time),
            validation_level=validation_level
        )
    
    async def clean_data(self, demographic_data: Dict) -> Dict:
        """Apply data cleaning based on validation results"""
        quality_report = await self.assess_data_quality(demographic_data)
        
        cleaned_data = demographic_data.copy()
        
        # Apply cleaning suggestions
        for result in quality_report.field_results:
            if result.cleaned_value is not None:
                if result.field_name == 'address':
                    cleaned_data['address'] = result.cleaned_value
                else:
                    cleaned_data[result.field_name] = result.cleaned_value
        
        # Add quality metadata
        cleaned_data['_quality_score'] = quality_report.overall_score
        cleaned_data['_quality_level'] = quality_report.quality_level.value
        cleaned_data['_validation_timestamp'] = datetime.now().isoformat()
        
        return cleaned_data
    
    async def detect_duplicates(self, records: List[Dict], 
                              similarity_threshold: float = 0.85) -> List[List[int]]:
        """Detect potential duplicate records"""
        duplicate_groups = []
        processed_indices = set()
        
        for i in range(len(records)):
            if i in processed_indices:
                continue
            
            current_group = [i]
            
            for j in range(i + 1, len(records)):
                if j in processed_indices:
                    continue
                
                similarity = await self._calculate_record_similarity(records[i], records[j])
                if similarity >= similarity_threshold:
                    current_group.append(j)
                    processed_indices.add(j)
            
            if len(current_group) > 1:
                duplicate_groups.append(current_group)
                processed_indices.update(current_group)
        
        return duplicate_groups
    
    async def _calculate_record_similarity(self, record1: Dict, record2: Dict) -> float:
        """Calculate similarity between two records"""
        similarities = []
        weights = []
        
        # Name similarity
        if record1.get('first_name') and record2.get('first_name'):
            sim = SequenceMatcher(None, 
                                record1['first_name'].lower(), 
                                record2['first_name'].lower()).ratio()
            similarities.append(sim)
            weights.append(0.2)
        
        if record1.get('last_name') and record2.get('last_name'):
            sim = SequenceMatcher(None, 
                                record1['last_name'].lower(), 
                                record2['last_name'].lower()).ratio()
            similarities.append(sim)
            weights.append(0.2)
        
        # Date of birth
        if record1.get('dob') and record2.get('dob'):
            sim = 1.0 if record1['dob'] == record2['dob'] else 0.0
            similarities.append(sim)
            weights.append(0.3)
        
        # SSN comparison
        if record1.get('ssn') and record2.get('ssn'):
            # Extract last 4 digits for comparison
            ssn1_last4 = re.sub(r'[^\d]', '', record1['ssn'])[-4:]
            ssn2_last4 = re.sub(r'[^\d]', '', record2['ssn'])[-4:]
            sim = 1.0 if ssn1_last4 == ssn2_last4 else 0.0
            similarities.append(sim)
            weights.append(0.3)
        
        # Calculate weighted average
        if not similarities:
            return 0.0
        
        weighted_sum = sum(s * w for s, w in zip(similarities, weights))
        total_weight = sum(weights)
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    async def get_quality_statistics(self, records: List[Dict]) -> Dict:
        """Get quality statistics for a dataset"""
        if not records:
            return {}
        
        quality_scores = []
        field_completeness = defaultdict(int)
        issue_counts = defaultdict(int)
        
        for record in records:
            quality_report = await self.assess_data_quality(record)
            quality_scores.append(quality_report.overall_score)
            
            # Count field completeness
            for field in self.field_weights.keys():
                if record.get(field):
                    field_completeness[field] += 1
            
            # Count issues
            for issue in quality_report.critical_issues + quality_report.warnings:
                issue_counts[issue] += 1
        
        # Calculate statistics
        total_records = len(records)
        avg_quality = np.mean(quality_scores)
        quality_distribution = {
            'excellent': len([s for s in quality_scores if s >= 95]),
            'good': len([s for s in quality_scores if 85 <= s < 95]),
            'fair': len([s for s in quality_scores if 70 <= s < 85]),
            'poor': len([s for s in quality_scores if s < 70])
        }
        
        # Convert completeness to percentages
        completeness_percentages = {
            field: (count / total_records) * 100
            for field, count in field_completeness.items()
        }
        
        return {
            'total_records': total_records,
            'average_quality_score': avg_quality,
            'quality_distribution': quality_distribution,
            'field_completeness': completeness_percentages,
            'common_issues': dict(Counter(issue_counts).most_common(10))
        }